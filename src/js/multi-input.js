export class MultiInput {
  constructor(element, options = {}) {
    if (!element) {
      throw new Error('No element provided to MultiInput');
    }

    if (!(element instanceof Element)) {
      throw new Error('Invalid element provided to MultiInput - must be a valid DOM element');
    }

    this.el               = element;
    this.el._multiInput   = this;
    this.defaultOptions   = {
      class: '',
      prefill: this.el.value ? [this.el.value] : [],
      useListValue: true
    };

    this.el.value = '';

    if(this.el.dataset.prefill && this.el.dataset.prefill != ''){
      options.prefill     = JSON.parse(this.el.dataset.prefill);
    }

    if(this.el.dataset.uselistvalue != undefined){
      options.useListValue  = this.el.dataset.uselistvalue !== 'false';
    }

    this.options          = { ...this.defaultOptions, ...options };

    this.descriptor = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    );

     // Keep track of which keys are pressed
    this.keysPressed = {};

    this.init();

    this.addListeners();
  }

  /**
   * Builds the needed html
   */
  init = () => {
    /**
     * Add [] to the name if needed
     */
    if(!this.el.name.includes('[]')){
      this.el.name += '[]';
    }

    /**
     * Store whether required
     */
    if(this.el.required){
      this.el.dataset.required  = true;
    }

    /**
     * Create the list
     */
    const wrapper = document.createElement('div');

    wrapper.innerHTML = `
      <div class="${this.options.class} option-wrapper">
        <ul class="list-selection-list">
        </ul>

        <div class="multi-text-input-wrapper">
          <button
            type="button"
            class="small add-list-selection hidden"
          >
            Add
          </button>
        </div>
      </div>
    `;

    const container     = wrapper.firstElementChild;
    const inputWrapper  = container.querySelector('.multi-text-input-wrapper');
    this.addButton      = inputWrapper.querySelector('.add-list-selection');
    this.list           = container.querySelector('.list-selection-list');

    // Insert wrapper before original element
    this.el.parentNode.insertBefore(container, this.el);

    // Move original element into wrapper before the button
    inputWrapper.insertBefore(this.el, this.addButton);

    /**
     * Create the list items if needed
     */
    this.options.prefill.forEach(value => {
      this.el.value = value;
      this.addListSelection(value)
    });
  };

  addListeners = () =>{
    this.el.addEventListener("input", () => this.handleInput());

    this.el.addEventListener("keyup", (ev) => this.handleKeyUp(ev));

    this.el.addEventListener("keydown", (ev) => this.handleKeyDown(ev));

    // add button clicked
    this.addButton.addEventListener("click", () => this.addListSelection());

    this.overwriteValueCalls();
  }

  /**
   * Label of an already added item clicked
   * Allow editing
   */
  editValue   = (target) => {
    // Add the value to the main input
    this.el.value = target
      .closest(`.list-selection`)
      .querySelector(`input`).value;

    // Show the add button
    this.addButton.classList.remove("hidden");

    // Remove the original item, so it can be re-added
    target.closest(".list-selection").remove();
  }

  /**
   * Remove an existing value
   * @param {*} target 
   * @returns 
   */
  removeValue   = (target) => {
    /**
     * Make the main input required again if we are removing the last added item
     */
    let remaining         = this.list.querySelectorAll(`li`).length;
    let shouldBeRequired  = this.el.dataset.required;

    if(shouldBeRequired && remaining === 1){
      this.el.required  = true;
    }
    
    // Do the removal
    target.closest(".list-selection").remove();
  }
  
  /**
   * We have changed the main input value 
   */
  handleInput = () => {
      /**
       * The current value is found in an attached datalist, add it straight away
       */
      if (
        this.el.list != null &&
        this.el.list.querySelector(`[value="${this.el.value}"]`) != null
      ) {
        this.addListSelection();
      } 
      
      /**
       * Show the add button
       */
      else {
        this.addButton.classList.remove("hidden");
      }
  }

  /**
   * Enter key hit and the main input had focus
   * And the shift key was not pressed
   * Add the current value
   */
  handleKeyUp   = (event) => {
    if (
      ["Enter", "NumpadEnter"].includes(event.key) &&
      this.keysPressed.Shift == undefined &&
      document.activeElement == this.el
    ) {
      this.addListSelection();
    }

    delete this.keysPressed[event.key];
  }

  handleKeyDown = (event) => {
    this.keysPressed[event.key] = true;
  }

  overwriteValueCalls() {
    // Ensure a lock flag exists on your instance
    this._isUpdatingValue = false;

    const self = this;

    Object.defineProperty(this.el, 'value', {
      get() {
        const originalValue = self.descriptor.get.call(this);

        // If already processing or an original value exists, return immediately to break the loop
        if (self._isUpdatingValue || originalValue) {
          return originalValue;
        }

        self._isUpdatingValue = true;
        try {
          const value = self.descriptor.get.call(this);
          return value ? value : self.getValues();
        } finally {
          self._isUpdatingValue = false;
        }
      },

      set(val) {
        if (self._isUpdatingValue) {
          self.descriptor.set.call(this, val);
          return;
        }

        self._isUpdatingValue = true;
        try {
          self.descriptor.set.call(this, val);
          self.addListSelection();
        } finally {
          self._isUpdatingValue = false;
        }
      }
    });
  }

  /**
   * Retrives the current values
   */
  getValues   = () => {
    return [...this.list.querySelectorAll('li input.multi-list-item')].map(el => el.value);
  }

  /**
   * Adds a list selection item when the text input has been filled
   */
  addListSelection() {
    // Hide the add button again
    this.addButton.classList.add("hidden");

    /**
     * Do nothing if there is no value or the value is already in the list
     */
    if (this.el.value == "" || this.getValues().includes(this.el.value)) {
      return;
    }

    // Element is no longer required as it has a value
    this.el.required = false;

    /**
     * Create the list item
     */
    let li = document.createElement("li");
    li.classList.add("list-selection");

    let html  = `<button type="button" class="small remove-list-selection"><span class='remove-list-selection'>×</span></button>`;

    let value = this.el.value;
    let text  = this.el.value;

    /**
     * find the option in the datalist
     */
    if (this.el.list != null && this.options.useListValue) {
      let option = this.el.list.querySelector(`[value="${this.el.value}"]`);

      if (option != null && option.dataset.value != null) {
        value = option.dataset.value;
      }
    }

    html += `<input type='hidden' class='multi-list-item' name='${this.el.name}' value='${value}'>`;
    html += `<span class='selected-name'>${text}</span>`;

    li.innerHTML = html;

    this.list.appendChild(li);

    /**
     * Add listeners
     */
    // Label clicked
    li.querySelector(`.selected-name`).addEventListener('click', ev => this.editValue(ev.target));
    
    // Remove button clicked
    li.querySelector(`.remove-list-selection`).addEventListener('click', ev => this.removeValue(ev.target));

    // clear the input
    this.el.value = "";
  }
}

export const attachAll = () => {
  document.querySelectorAll(`input[type="text"][multiple], input[type="email"][multiple], input[type="tel"][multiple], input[type="url"][multiple]`).forEach( el => new MultiInput(el));
}