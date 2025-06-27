const PERT = require('../script');

describe('PERT Class Max Method Test', () => {
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


describe('Testing the methods addStartDate and addFinishDate', () => {
  let pert;

  beforeEach(() => {
    // Initialiser un nouvel objet PERT avant chaque test
    pert = new PERT();

    // Simuler un ensemble de tâches
    // Les durées sont arbitraires
    pert.dico_task = {
      A: { duree: 2 },
      B: { duree: 3 },
      C: { duree: 4 },
    };

    // Simuler un seul chemin linéaire A -> B -> C
    pert.path = [['A', 'B', 'C']];
  });

  test('addStartDate() calcule correctement les dates de début', () => {
    pert.addStartDate();

    expect(pert.dico_task.A.start).toBe(2);           // A commence à 2 (sa propre durée)
    expect(pert.dico_task.B.start).toBe(5);           // 2 (A) + 3 (B)
    expect(pert.dico_task.C.start).toBe(9);           // 5 + 4
  });

  test('addFinishDate() calcule correctement les dates de fin après addStartDate()', () => {
    // D'abord calculer les dates de début
    pert.addStartDate();
    // Ensuite calculer les dates de fin
    pert.addFinishDate();

    expect(pert.dico_task.C.finish).toBe(9);          // C finit quand il commence
    expect(pert.dico_task.B.finish).toBe(5);          // 9 - 4
    expect(pert.dico_task.A.finish).toBe(2);          // 5 - 3
  });
});
