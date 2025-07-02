const PERT = require('../script');

describe('Testing the method max', () => {
  const pert = new PERT();

  test('max(5, 3) return 5', () => {
    expect(pert.max(5, 3)).toBe(5);
  });

  test('max(2, 8) return 8', () => {
    expect(pert.max(2, 8)).toBe(8);
  });

  test('max(4, 4) return 4', () => {
    expect(pert.max(4, 4)).toBe(4);
  });
});


describe('Testing the method addMargeDate', () => {
  test('Correctly add margin to each task', () => {
    const pert = new PERT();

    // Simulate tasks in dico_task
    pert.dico_task = {
      T1: { start: 2, finish: 5 }, // expected margin = 3
      T2: { start: 1, finish: 4 }  // expected margin = 3
    };

    // Calling the method
    pert.addMargeDate();

    // Verification
    expect(pert.dico_task.T1.marge).toBe(3);
    expect(pert.dico_task.T2.marge).toBe(3);
  });
});

describe('Test the method date mangement but juste addMargeDate', () => {
  let pert;

  beforeEach(() =>{
    // Initialize a new PERT object before each test
    pert = new PERT();

    // Simulate a set of tasks
    // The date are arbitrary
    pert.dico_task = {
      A: { start: 0, finish: 4 },
      B: { start: 5, finish: 5 },
      C: { start: 5, finish: 4 },
    }
  });

  test('addMargeDate() correctly calculates marge dates', () => {
    pert.addMargeDate();
    expect(pert.dico_task.A.marge).toBe(4);   // 4 - 0 
    expect(pert.dico_task.B.marge).toBe(0);   // 5 - 5
    expect(pert.dico_task.C.marge).toBe(-1);  // 4 - 5
  });
});

describe('Testing the methods date mangement (addStartDate, addFinishDate)', () => {
  let pert;

  beforeEach(() => {
    // Initialize a new PERT object before each test
    pert = new PERT();

    // Simulate a set of tasks
    // The durations are arbitrary
    pert.dico_task = {
      A: { duree: 2 },
      B: { duree: 3 },
      C: { duree: 4 },
    };

    // Simulate a single linear path A -> B -> C
    pert.path = [['A', 'B', 'C']];
  });

  test('addStartDate() correctly calculates start dates', () => {
    pert.addStartDate();

    expect(pert.dico_task.A.start).toBe(2);           // A starts at 2 (its own duration)
    expect(pert.dico_task.B.start).toBe(5);           // 2 (A) + 3 (B)
    expect(pert.dico_task.C.start).toBe(9);           // 5 + 4
  });


  test('addFinishDate() correctly calculates end dates after addStartDate()', () => {
    // D'abord calculer les dates de début
    pert.addStartDate();
    // Ensuite calculer les dates de fin
    pert.addFinishDate();

    expect(pert.dico_task.C.finish).toBe(9);          // C It ends when it begins
    expect(pert.dico_task.B.finish).toBe(5);          // 9 - 4
    expect(pert.dico_task.A.finish).toBe(2);          // 5 - 3
  });
});

describe('Test the method date mangement but juste dateManagement', () => {
  let pert;

  beforeEach(() => {
    // Initialize a new PERT object before each test
    pert = new PERT();

    // Simulate a set of tasks
    // The durations are arbitrary
    pert.dico_task = {
      A: { duree: 2 },
      B: { duree: 3 },
      C: { duree: 4 },
    };

    // Simulate a single linear path A -> B -> C
    pert.path = [['A', 'B', 'C']];
  });

  test('dateManagement() correctly calculates marge dates', () => {
    pert.dateManagement();
    expect(pert.dico_task.A.start).toBe(2);
    expect(pert.dico_task.A.marge).toBe(0);
    expect(pert.dico_task.A.finish).toBe(2);
    expect(pert.dico_task.B.start).toBe(5);
    expect(pert.dico_task.B.finish).toBe(5);
    expect(pert.dico_task.B.marge).toBe(0);
    expect(pert.dico_task.C.start).toBe(9);
    expect(pert.dico_task.C.finish).toBe(9);
    expect(pert.dico_task.C.marge).toBe(0);
  });
});

describe('Testing the method findKeysWithValueInMere', () => {
  let pert;

  beforeEach(() => {
    pert = new PERT();

    // Simulate a set of tasks
    // The mother task are arbitrary
    pert.dico_task = {
      A: { mother: ["Start"] },
      B: { mother: ["A"] },
      C: { mother: ["A", "B"] },
      D: { mother: ["B", "C"] },
    };
  });

  test('findKeysWithValueInMere(A) return B, C ', () => {
    expect(pert.findKeysWithValueInMere("A")).toEqual(["B", "C"]);
  });
  test('findKeysWithValueInMere(C) return D ', () => {
    expect(pert.findKeysWithValueInMere("C")).toEqual(["D"]);
  });
  test('findKeysWithValueInMere(D) return [] ', () => {
    expect(pert.findKeysWithValueInMere("D")).toEqual([]);
  });
});



describe('Testing the method addElementInPath', () => {
  let pert;
  let twoDList;
  let liste;

  beforeEach(() => {
    pert     = new PERT();
    pert.dico_task = {
      A : {mother : ["Start"],},
      B : {mother : ["A"],},
      C : {mother : ["B"],},
      D : {mother : ["C", "A"]},
      E : {mother : ["Start"],},
      F : {mother : ["A", "E"],},
      J : {mother : ["D", "F"],}
    };
    twoDList = [["A"], ["E"]];
    liste    = ["A"];


  });
  test('addElementInPath return true for continue the loop', () => {
    expect(pert.addElementInPath(twoDList, liste)).toEqual(true);
  });

  test('twoDList is modified correctly', () => {
    pert.addElementInPath(twoDList, liste);
    expect(twoDList).toEqual([["A", "B"], ["E"], ["A", "D"], ["A", "F"]]);
  }); 
  
});

describe('Testing the method chainManagement', () => {
  let twoDList;

  beforeEach(() => {
    pert     = new PERT();
    pert.dico_task = {
      A : {mother : ["Start"],},
      B : {mother : ["A"],},
      C : {mother : ["B"],},
      D : {mother : ["C", "A"]},
      E : {mother : ["Start"],},
      F : {mother : ["A", "E"],},
      J : {mother : ["D", "F"],}
    }
  });

  test('path are correctly create', () => {
    expect(pert.chainManagement()).toEqual([["E", "F", "J"], ["A", "F", "J"], ["A", "B", "C", "D", "J"]]);
  });

});

describe('Testing the method creationArrayFirstElements', () => {
  let twoDList;

  beforeEach(() => {
    pert     = new PERT();
    pert.dico_task = {
      A : {mother : ["Start"],},
      B : {mother : ["A"],},
      C : {mother : ["B"],},
      D : {mother : ["C", "A"]},
      E : {mother : ["Start"],},
      F : {mother : ["A", "E"],},
      J : {mother : ["D", "F"],}
    }
  });

  test('creationArrayFirstElements is correctly create', () => {
    expect(pert.creationArrayFirstElements()).toEqual(["A", "E"]);
  });
});

describe('Testing the method creatingPath', () => {
  let twoDList;
  let first_element;

  beforeEach(() => {
    pert     = new PERT();
    pert.dico_task = {
      A : {mother : ["Start"],},
      B : {mother : ["A"],},
      C : {mother : ["B"],},
      D : {mother : ["C", "A"]},
      E : {mother : ["Start"],},
      F : {mother : ["A", "E"],},
      J : {mother : ["D", "F"],}
    }
    first_element = ["A", "E"];
  });

  test('creatingPath is correctly create', () => {
    expect(pert.creatingPath(first_element)).toEqual([["E", "F", "J"], ["A", "F", "J"], ["A", "B", "C", "D", "J"]]);
  });
});

describe('Testing the method checkCycleData', () => {
  let pert;

  beforeEach(() => {
    pert = new PERT();
  });

  test('checkCycleData does not throw an error when no cycles are detected', () => {
    // Mock hasDuplicates to return false for all sub-arrays
    pert.hasDuplicates = jest.fn().mockReturnValue(false);

    const twoDList = [["A"], ["B"], ["C"]];
    expect(() => pert.checkCycleData(twoDList)).not.toThrow();
  });
});


describe('Test the method hasDuplicates', () => {
  let pert;
  let array;

  beforeEach(() => {
    pert = new PERT();
  });

  test('hasDuplicates detected correctly if there are NO duplicates return False', () => {
    expect(pert.hasDuplicates(['A', 'B', 'C'])).toBe(false);
  });

  test('hasDuplicates detected correctly if there are duplicates return True', () => {
    expect(pert.hasDuplicates(['A', 'B', 'A'])).toBe(true);
  })
});


describe('Test the method getFirstAndLastElements', () => {
  let pert;
  let array2D;

  beforeEach(() => {
    pert = new PERT();
    array2D = [["A","B"], ["E", "F", "K"], ["A", "D", "J"], ["A", "F"]];
  });

  test('getFirstAndLastElements  is correctly', () => {
    expect(pert.getFirstAndLastElements(array2D)).toEqual({"firstElements": ["E","A"], "lastElements": ["K", "J"], "position": [1, 2]});
  })  

});




