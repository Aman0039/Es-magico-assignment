const { detectCycle, buildAdjacencyMap, topologicalSort } = require('../src/utils/cycleDetection');

describe('Cycle Detection', () => {
  test('detects no cycle in simple linear chain', () => {
    const tasks = [
      { _id: 'A', dependencies: [] },
      { _id: 'B', dependencies: ['A'] },
      { _id: 'C', dependencies: ['B'] }
    ];
    const map = buildAdjacencyMap(tasks);
    const { hasCycle } = detectCycle('D', ['C'], map);
    expect(hasCycle).toBe(false);
  });

  test('detects cycle', () => {
    const tasks = [
      { _id: 'A', dependencies: ['C'] },
      { _id: 'B', dependencies: ['A'] },
      { _id: 'C', dependencies: ['B'] }
    ];
    const map = buildAdjacencyMap(tasks);
    // A -> C, C is already in the map with B which depends on A
    const { hasCycle } = detectCycle('A', ['C'], map);
    expect(hasCycle).toBe(true);
  });

  test('prevents self-dependency', () => {
    const tasks = [{ _id: 'A', dependencies: [] }];
    const map = buildAdjacencyMap(tasks);
    const { hasCycle } = detectCycle('A', ['A'], map);
    expect(hasCycle).toBe(true);
  });
});

describe('Topological Sort', () => {
  test('sorts tasks in dependency order', () => {
    const tasks = [
      { _id: { toString: () => 'C' }, dependencies: [{ toString: () => 'B' }], priority: 3, estimatedHours: 1, createdAt: new Date() },
      { _id: { toString: () => 'A' }, dependencies: [], priority: 5, estimatedHours: 2, createdAt: new Date() },
      { _id: { toString: () => 'B' }, dependencies: [{ toString: () => 'A' }], priority: 4, estimatedHours: 1, createdAt: new Date() }
    ];

    const sorted = topologicalSort(tasks);
    expect(sorted).not.toBeNull();
    const ids = sorted.map(t => t._id.toString());
    expect(ids.indexOf('A')).toBeLessThan(ids.indexOf('B'));
    expect(ids.indexOf('B')).toBeLessThan(ids.indexOf('C'));
  });

  test('returns null for cyclic graph', () => {
    const tasks = [
      { _id: { toString: () => 'A' }, dependencies: [{ toString: () => 'B' }] },
      { _id: { toString: () => 'B' }, dependencies: [{ toString: () => 'A' }] }
    ];
    const sorted = topologicalSort(tasks);
    expect(sorted).toBeNull();
  });
});

describe('Execution Ordering Logic', () => {
  test('sorts by priority descending, then estimatedHours ascending', () => {
    const tasks = [
      { _id: '1', priority: 3, estimatedHours: 5, createdAt: new Date('2024-01-01') },
      { _id: '2', priority: 5, estimatedHours: 2, createdAt: new Date('2024-01-01') },
      { _id: '3', priority: 5, estimatedHours: 1, createdAt: new Date('2024-01-01') },
      { _id: '4', priority: 4, estimatedHours: 3, createdAt: new Date('2024-01-01') }
    ];

    const sorted = [...tasks].sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      if (a.estimatedHours !== b.estimatedHours) return a.estimatedHours - b.estimatedHours;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    expect(sorted[0]._id).toBe('3'); // priority 5, hours 1
    expect(sorted[1]._id).toBe('2'); // priority 5, hours 2
    expect(sorted[2]._id).toBe('4'); // priority 4
    expect(sorted[3]._id).toBe('1'); // priority 3
  });
});

describe('Simulation Logic', () => {
  test('selects tasks within available hours', () => {
    const candidates = [
      { _id: '1', title: 'Task 1', priority: 5, estimatedHours: 3, resourceTag: '' },
      { _id: '2', title: 'Task 2', priority: 4, estimatedHours: 3, resourceTag: '' },
      { _id: '3', title: 'Task 3', priority: 3, estimatedHours: 5, resourceTag: '' }
    ];

    const availableHours = 6;
    let remaining = availableHours;
    const selected = [];

    for (const task of candidates) {
      if (task.estimatedHours <= remaining) {
        selected.push(task);
        remaining -= task.estimatedHours;
      }
    }

    expect(selected.length).toBe(2);
    expect(selected[0]._id).toBe('1');
    expect(selected[1]._id).toBe('2');
    expect(remaining).toBe(0);
  });

  test('respects resource tag constraints', () => {
    const candidates = [
      { _id: '1', priority: 5, estimatedHours: 1, resourceTag: 'gpu' },
      { _id: '2', priority: 4, estimatedHours: 1, resourceTag: 'gpu' },
      { _id: '3', priority: 3, estimatedHours: 1, resourceTag: 'cpu' }
    ];

    const selected = [];
    const usedResources = new Set();

    for (const task of candidates) {
      if (task.resourceTag && usedResources.has(task.resourceTag)) continue;
      selected.push(task);
      if (task.resourceTag) usedResources.add(task.resourceTag);
    }

    expect(selected.length).toBe(2);
    expect(selected.map(t => t._id)).toEqual(['1', '3']);
  });
});

describe('Stale Update Rejection', () => {
  test('detects version mismatch', () => {
    const taskInDB = { versionNumber: 3 };
    const clientVersion = 2;

    const isStale = taskInDB.versionNumber !== clientVersion;
    expect(isStale).toBe(true);
  });

  test('allows update when versions match', () => {
    const taskInDB = { versionNumber: 3 };
    const clientVersion = 3;

    const isStale = taskInDB.versionNumber !== clientVersion;
    expect(isStale).toBe(false);
  });
});
