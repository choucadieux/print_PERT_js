class PERT {
  // Constant initialization 
  // -----------------------
  static OFFSET_HEIGHT = 75;  // int -> Offset for the first task in height
  static OFFSET_WIDTH  = 250; // int -> Offset for the first task in width 
  static DIFF_HEIGHT   = 100; // int -> Space between each task in height
  static DIFF_WIDTH    = 350; // int -> Space between each task in width
  static SEP_TASK_ARROW_START  = 10;  // int -> Space between task and arrow 
  static SEP_TASK_ARROW_FINISH = -15; // int -> Space between task and arrow 
  static STARTVALUE = "Start";        // str -> Name of fisrt element

  // Constructor 
  // -----------
  constructor(dico_task, date_start=0) {
    this.dico_task = dico_task;  // dict           -> All the tasks
    this.path = [];              // array<array<>> -> All the path 
    this.date_start = date_start
  }

  /**
  * Prints the PERT in the DOM.
  *
  * This function calls up all the functions for creating the PERT.
  *
  * @returns {void} - Displays the PERT chart in the DOM.
  */
  printPERT() {
    let liste_value_per_rank;


    this.path = this.chainManagement();
    this.rangPosition();
    this.positionMap(); 
    this.addMarge();
    this.positionTask();
    this.printTasks(this.dico_task);
    this.addArrow();
    this.addStartAndFinish();  // Function no Finish
    

    console.log(this.dico_task);

  }

  addMarge() {
    this.addStartDate();
    this.addFinishDate();
    this.addMargeDate();
 
  }

  addMargeDate() {
    for (const task of Object.values(this.dico_task)) {
      task["marge"] = task["finish"] - task["start"];
    }
  }

  addFinishDate() {
    let value;
    let somme;

    for (const table of this.path) {
      for (let i = table.length - 1; i >= 0; i--) {
        value = table[i];

        if (i === table.length - 1) {
          somme = this.dico_task[value]["start"];
          this.dico_task[value]["finish"] = somme;
          somme -= this.dico_task[value]["duree"]
        } else {
          if ("finish" in this.dico_task[value]) {
            if (somme < this.dico_task[value]["finish"]) { 
              this.dico_task[value]["finish"] = somme;
              somme -= this.dico_task[value]["duree"];
            }
          } else { 
            this.dico_task[value]["finish"] = somme;
            somme -= this.dico_task[value]["duree"];
          }
        }
      }
    }
  }

  addStartDate() {
    let somme;
    let value;

    for (const table of this.path) {
      for (let i=0; i < table.length; i++) {
        
        value = table[i];

        if (i === 0) {
          somme = this.dico_task[value]["duree"];
          this.dico_task[value]["start"] = somme;
          
        } else {
          if ("start" in this.dico_task[value]) {
            if ((somme+this.dico_task[value]["duree"]) > this.dico_task[value]["start"]) {
              somme += this.dico_task[value]["duree"]; 
              this.dico_task[value]["start"] = somme;
            }
          } else {
            somme += this.dico_task[value]["duree"]; 
            this.dico_task[value]["start"] = somme;
          }
        }
      }
    }
  }

  isDate(value) {
    return value instanceof Date;
  }

  /* ====================================================================================================
   * PART ON PATH CREATION
   * ====================================================================================================*/

  /**
   * Creates all the paths of the PERT in a two-dimensional array.
   *
   * @returns {Array<Array>} A two-dimensional array with all the paths.
   */
  chainManagement() {
    let array_1D;  // Array -> Array 1D with the fisrt element of paths
    let array_2D;  // Array -> Array 2D with all paths
    
    try {
      array_1D = this.creationArrayFirstElements();  // Validate the start tasks 
      array_2D = this.creatingPath(array_1D);        // Create the paths
    } catch (error) {
      console.error(error.message);
    }

    return array_2D;
  }

  /**
   * Finds the keys with the start value in the dictionary and validates the configuration.
   *
   * @returns {Array} A one-dimensional array with the fisrt elements.
   * @throws {Error} If there are no start tasks or if the configuration is incorrect.
   */
  creationArrayFirstElements() {
    // Find keys with the start value
    const firstElementArray = this.findKeysWithValueInMere(PERT.STARTVALUE);

    // Check if there are any start tasks
    if (firstElementArray.length === 0) {
      throw new Error(
        `Error: The configuration file for creating the PERT is not correct.
       There is no start task: '${PERT.STARTVALUE}'`
      );
    }

    // Validate the configuration of the start tasks
    for (const key of firstElementArray) {
      const motherLength = this.dico_task[key]["mother"].length;
      if (motherLength !== 1) {
        throw new Error(
          `Warning: The configuration file for creating the PERT is not correct.
          Targeting data on the first task is incorrect for key: ${key}`
          );
      }
    }

    return firstElementArray;
  }

  /**
   * Creates paths from the given array of first elements.
   * 
   * @param {Array} first_element_array - The array of first elements to start the paths.
   * @returns {Array} - A 2D array where each sub-array represents a path.
   */
  creatingPath(first_element_array) {
    let twoDList = [];     // Initialize a 2D list to store the paths
    let continued = true;  // Flag to control the loop

    // Populate the 2D list with initial paths, each containing a single element from the input array
    for (const key of first_element_array) {
        twoDList.push([key]);
    }
    
    // Loop to create the paths
    while (continued) {
      continued = false;

      // Iterate over each path in the 2D list
      for (const liste of twoDList) {
        // Attempt to add an element to the current path
        continued = this.addElementInPath(twoDList, liste) || continued;

        // Check for cycles in the data and remove them if found
        try {
          this.checkCycleData(twoDList);
        } catch (e) {
            throw e;
        }

        // Apply DAG algorithms to the paths
        this.algothmDags(twoDList);
      }
    }

    // Return the final 2D list containing all paths
    return twoDList;
  }


  /**
   * The addArrow function creates SVG arrows between tasks based on a predefined path.
   * Each arrow is generated as an SVG element and inserted into the DOM. The function
   * iterates over the path array, calculates the positions of the tasks, and draws an
   * arrow between consecutive tasks.
   */
  addArrow() {
    // Variables to store HTML elements and positions
    let taskHTML;
    let div1, div2;
    let x_start, x_inter, x_finish;
    let y_start, y_finish;

    // Iterate over each path in the path array
    for (const array of this.path) {
      // Iterate over each task in the current path, except the last one
      for (let i = 0; i < array.length - 1; i++) {
        // Get the HTML elements for the current and next tasks
        div1 = document.getElementById(this.dico_task[array[i]]["id"]);
        div2 = document.getElementById(this.dico_task[array[i + 1]]["id"]);

        // Calculate the starting and finishing x-coordinates
        x_start = div1.offsetLeft + div1.offsetWidth;
        x_finish = div2.offsetLeft;
        x_inter = (x_start + x_finish) / 2;

        // Calculate the starting and finishing y-coordinates
        y_start = div1.offsetTop + div1.offsetHeight / 2;
        y_finish = div2.offsetTop + div2.offsetHeight / 2;

        // Create the SVG arrow HTML
        taskHTML = `
          <svg
            id="svg${i}"
            xmlns="http://www.w3.org/2000/svg"
            width="${this.max(x_start, x_finish) + 50}px"
            height="${this.max(y_start, y_finish) + 50}px">
            <path
              style="fill:none;stroke:#000000;stroke-width:3;"
              d="M${x_start + 10},${y_start} C${x_inter},${y_start} ${x_inter},${y_finish} ${x_finish - 15},${y_finish}"
              id="path1"
              marker-end="url(#arrowhead)"/>
          </svg>
        `;

        // Add the SVG arrow to the DOM
        this.addInDom(taskHTML, "svg-container");
      }
    }
  }


  /**
   * The addInDom function adds the generated SVG arrow HTML to the DOM.
   * It creates a temporary div element, sets its inner HTML to the SVG arrow HTML,
   * and appends it to the container with the class "PERT-conteneur". If the container
   * is not found, it throws an error.
   *
   * @param {string} taskHTML - The SVG arrow HTML to be added to the DOM.
   * @throws {Error} - Throws an error if the container with the class "PERT-conteneur" is not found.
   */
  addInDom(taskHTML, str_container) {
    const container = document.getElementById(str_container);
    const tempDiv = document.createElement('div');

    // Set the inner HTML of the temporary div to the SVG arrow HTML
    tempDiv.innerHTML = taskHTML;

    // Adding data to the DOM if it exists else print error
    if (container) {
      container.append(tempDiv);
    } else {
      throw new Error(`The container with the class ${str_container} was not found.`);
    }
  }



  addStartAndFinish() {
    // Start
    const { max_item_col, max_item_rank } = this.maxColRank();    
    const max_height = PERT.DIFF_HEIGHT * max_item_col;
    const max_weight = PERT.DIFF_WIDTH  * max_item_rank;
    const decal      = 80;
    const squareSize = 90;
    const text_start = "Start"

    // Simple rect element
    const taskHTML = `
      <svg height="${max_height+squareSize+30}" width="${decal+squareSize+30}" xmlns="http://www.w3.org/2000/svg">
        <rect x="75" y="${max_height/2+50}" id="Start"
              width="${squareSize}" height="${squareSize}"
              transform="rotate(45 ${squareSize} ${squareSize})"
              fill="none" stroke="var(--back-ground-text)" stroke-width="3" />
        <text x="${decal-10}" y="${max_height+squareSize/2+10}" 
              text-anchor="middle" alignment-baseline="middle" 
              fill="black" font-size="20" font-weight="bold">
          ${text_start}
        </text>
      </svg>`;
    this.addInDom(taskHTML, "task-container");

    let bloc1; let bloc2;
    let div1;  let div2;
    let x_start; let x_inter; let x_finish;
    let y_start; let y_finish;
    const column = this.path.map(row => row[0]);
 
    div1  = document.getElementById("Start");
    const bbox = div1.getBBox();
    for (let i of column) {

      // Get element task i and task i+1
      div2  = document.getElementById(this.dico_task[i]["id"]);
      x_start  = bbox.x+bbox.width;
      x_finish = div2.offsetLeft;
      x_inter  = (x_start + x_finish)/ 2
      y_start  = bbox.y + bbox.height/2;
      y_finish = div2.offsetTop + div2.offsetHeight/2;

      const taskHTML2 = `
        <svg 
          id     = "svg${i}" 
          xmlns  = "http://www.w3.org/2000/svg"  
          width  = "${this.max(x_start, x_finish)+50}px"
          height = "${this.max(y_start, y_finish)+50}px">
          <path
            style="fill:none;stroke:#000000;stroke-width:3;"
            d="M${x_start},${y_start} C${x_inter},${y_start} ${x_inter},${y_finish} ${x_finish-15},${y_finish}"
            id="path1"
            marker-end="url(#arrowhead)"/>
        </svg>
      `;
      this.addInDom(taskHTML2, "svg-container"); 
    }
  }


  positionMap() {
    const dico_number = {};
    let number;
    let task;

    for (task of Object.values(this.dico_task)) {
      number = task["rank"];

      // If the rank already exists in dico_number, increment the position
      if (number in dico_number) {
        task["position"] = dico_number[number];
        dico_number[number]++;
      } else {
        // Otherwise, initialize the position to 0 and add the rank to dico_number
        task["position"] = 0;
        dico_number[number] = 1;
      }
    }
  }

  maxColRank() {
    const liste_position = [];
    const liste_rank     = [];

    for (const task of Object.values(this.dico_task)) {
      liste_position.push(task["position"]); 
      liste_rank.push(task["rank"]);
    }
    const max_item_col  = Math.max.apply(null, liste_position);
    const max_item_rank = Math.max.apply(null, liste_rank);

    return { max_item_col, max_item_rank };
  }

  positionTask() {
    const { max_item_col, max_item_rank } = this.maxColRank();
    let pos;
    let rank;
    
    const max_height = PERT.DIFF_HEIGHT * max_item_col;
    const max_weight = PERT.DIFF_WIDTH  * max_item_rank;

    for (const task of Object.values(this.dico_task)) {
      pos  = task["position"];
      rank = task["rank"];

      task["pos_x"] = max_weight * (rank / max_item_rank) + PERT.OFFSET_WIDTH;
      task["pos_y"] = max_height * (pos  / max_item_col)  + PERT.OFFSET_HEIGHT;
    }
  }


  /**
   * Updates the 'rank' field for each element in a 2D path array (`this.path`) based on its column position.
   * 
   * For each element in each path:
   * - If a 'rank' already exists, it keeps the highest (maximum) rank seen so far.
   * - If no 'rank' exists, it assigns the current position as the rank.
   *
   * This is typically used to assign or update hierarchical levels or processing order.
   */
  rangPosition() {
    const RANK_KEY = 'rank';
    let position;

    for (const row of this.path) {
      position = 0;

      for (const col of row) {
        const task = this.dico_task[col];

        if (task.hasOwnProperty(RANK_KEY)) {
          // If 'rank' already exists and is less than current position → update it
          if (task[RANK_KEY] < position) {
            task[RANK_KEY] = position;
          }
        } else {
          // Otherwise, initialize it with the current position
          task[RANK_KEY] = position;
        }

        position++;
      }
    }
  }


  /* ----------------------------------------------------------------------------------------------------
   * Part on display
   * ----------------------------------------------------------------------------------------------------*/

  /**
  * Prints the tasks in the DOM.
  *
  * This function iterates over the tasks and calls `printTaskDict` to display each task in the PERT chart.
  *
  * @param {Object} tasks_obj - An object containing all the tasks to be displayed in the PERT chart.
  * @returns {void} - Displays the PERT chart in the DOM.
  */
  printTasks(tasks_obj) {
    for (let task_obj of Object.values(tasks_obj)) {
        const taskHTML  = this.htmlTaskCreation(task_obj);  // Task
        this.addInDom(taskHTML, "task-container");    // Displays each task
    } 
  }

  /**
  * Creates the HTML representation of a task.
  *
  * This function validates the task object and generates the HTML string for the task.
  *
  * @param {Object} task_obj       - The task object to be converted to HTML.
  * @param {string} task_obj.id    - The unique identifier of the task.
  * @param {string} task_obj.title - The title of the task.
  * @param {number} task_obj.pos_x - The x-coordinate position of the task.
  * @param {number} task_obj.pos_y - The y-coordinate position of the task.
  * @param {string} task_obj.marge - The margin of the task.
  * @param {string} task_obj.debut - The start time of the task.
  * @param {string} task_obj.fin   - The end time of the task.
  * @returns {string} - The HTML string representing the task.
  * @throws {Error} - Throws an error if any required property is missing.
  */
  htmlTaskCreation(task_obj) {
    // Error handling if tasks do not have the correct parameters
    /*
    const requiredProperties = ['id', 'title', 'pos_x', 'pos_y', 'marge', 'start', 'finish'];
    
    // Check error
    for (const prop of requiredProperties) {
        if (task_obj[prop] === undefined) {  // If there is an error then display the error
            throw new Error(`The property "${prop}" is missing from the task object.`);
        }
    }; */

    // Creating HTML for the DOM
    const taskHTML = `
      <div class="PERT-task" 
           style="
            top: ${task_obj.pos_y}px; 
            left: ${task_obj.pos_x}px; 
            position: absolute;" 
           id="${task_obj.id}">
        <div class="PERT-titre">${task_obj.title}</div>
        <div class="PERT-sous-partie">
          <div class="PERT-sous-partie-gauche">${task_obj.id}</div>
          <div class="PERT-sous-partie-droite">${task_obj.marge}</div>
        </div>
        <div class="PERT-sous-partie">
          <div class="PERT-sous-partie-gauche">${task_obj.start}</div>
          <div class="PERT-sous-partie-droite">${task_obj.finish}</div>
        </div>
      </div>
    `;

    // Return
    return taskHTML;
  }

  /**
   * The findSequence function searches for a specific sequence of elements within a 2D array.
   * It iterates through each sub-array (row) and each element within the sub-array (column)
   * to find the sequence. If the sequence is found, it returns an object containing the row
   * and column indices of the first element in the sequence. If the sequence is not found,
   * it returns null.
   *
   * @param {Array} list - The 2D array in which to search for the sequence.
   * @param {Array} sequence - The sequence of elements to search for. The sequence should
   *                           contain exactly two elements.
   * @returns {Object|null} - An object containing the row and column indices of the first
   *                          element in the sequence if found, or null if the sequence is not found.
   */
  findSequence(list, sequence) {
    for (let i = 0; i < list.length; i++) {
      for (let j = 0; j < list[i].length - 1; j++) {
        if (list[i][j] === sequence[0] && list[i][j + 1] === sequence[1]) {
          return { row: i, col: j };
        }
      }
    }
    return null; // Returns null if the sequence is not found
  }

  /**
  * Checks if there are any duplicate elements in the given array.
  *
  * @param {Array<any>} subList - The array to check for duplicates.
  * @returns {boolean} Returns true if duplicates are found, otherwise false.
  */
  hasDuplicates(subList) {
    const seen = new Set();
    for (const item of subList) {
      if (seen.has(item)) {
        return true;
      }
      seen.add(item);
    }
    return false;
  }

  /**
  * Checks if there are any cycles in the given 2D list that could create an infinite loop.
  *
  * @param {Array<Array<any>>} twoDList - A 2D list to check for cycles.
  * @throws {Error} Throws an error if a cycle is detected, indicating an infinite loop.
  */
  checkCycleData(twoDList) {
    // Loop through each sub-array in the 2D list
    for (let i = 0; i < twoDList.length; i++) {
      // Check if the current sub-array has duplicates
      if (this.hasDuplicates(twoDList[i])) {
        throw new Error(`Cycle detected in path at index ${i}: infinite loop risk.`);
      }
    }
  }

  getFirstAndLastElements(twoDList) {
    const firstElements = [];
    const lastElements  = [];
    const position      = [];

    for (let i = 0; i < twoDList.length; i++) {
      if (twoDList[i].length >= 3) {
        firstElements.push(twoDList[i][0]);
        lastElements.push(twoDList[i][twoDList[i].length - 1]);
        position.push(i);
      }
    }

    return { firstElements, lastElements, position };
  }
  
  algothmDags(twoDList) {
    const list_first_last = this.getFirstAndLastElements(twoDList);
    let array = [];
    let array_after  = [];
    let array_before = [];
    let array_new    = [];
    let value;
    let position;
    for (let i = 0; i < list_first_last.firstElements.length; i++) {
      array[0] = list_first_last.firstElements[i];
      array[1] = list_first_last.lastElements[i];
      position = list_first_last.position[i];
      value = this.findSequence(twoDList, array);
      if (value) {
        // Get value after and before
        array_after  = twoDList[value.row].slice(0, value.col);
        array_before = twoDList[value.row].slice(value.col+2); 

        // Add a the end of the array
        twoDList[twoDList.length] = [...array_after, ...twoDList[position], ...array_before];

        // Delate the other data
        if (position > value) {
          twoDList.splice(position, 1);
          twoDList.splice(value.row, 1);
        } else {
          twoDList.splice(value.row, 1);
          twoDList.splice(position, 1); 
        }
      }
      
    }
  }

  /**
  * Adds child elements to an existing path in a 2D list based on a user-defined dictionary.
  *
  * @param {Array<Array<string>>} twoDList - A 2D array representing paths.
  * @param {Object<string, Array<string>>} dico_user - A dictionary mapping parent keys to their children.
  * @param {Array<string>} path - The current path to which children should be added.
  * @returns {boolean} Whether any children were added to an existing path.
  */
  addElementInPath(twoDList, path) {
    // Initialization
    let wasFirstChildAdded = false;
    let continued = false;
    const lastElement = path[path.length - 1];
    const savedPath = [...path];
    const children = this.findKeysWithValueInMere(lastElement);

    // Add each child to the path
    for (const child of children) {
      if (!wasFirstChildAdded) {
        // Add to existing branch
        const index = twoDList.findIndex(row => row[row.length - 1] === lastElement);
        if (index !== -1) {
          twoDList[index].push(child);
          continued = true;
          wasFirstChildAdded = true;
        }
      } else {
        // Create a new branch with the same base path and the new child
        const newPath = [...savedPath, child];
        twoDList.push(newPath);
      }
    }
    return continued;
  }


  


  /* ----------------------------------------------------------------------------------------------------
   * Tool
   * ----------------------------------------------------------------------------------------------------*/

  findKeysWithValueInMere(targetValue) {
    const result = [];
    
    for (const key in this.dico_task) {
        if (this.dico_task.hasOwnProperty(key) && this.dico_task[key].mother.includes(targetValue)) {
            result.push(key);
        }
    }
    return result;
  }

  /**
  * Returns the maximum of two numbers.
  *
  * @param {number} a - The first number.
  * @param {number} b - The second number.
  * @returns {number} The maximum of the two numbers.
  *
  * @example
  * const maxValue = max(10, 20);
  * console.log(maxValue); // Output: 20
  */
  max(a, b) {
    if (a > b) {
      return a;
    } else {
      return b;
    }
  }


}
