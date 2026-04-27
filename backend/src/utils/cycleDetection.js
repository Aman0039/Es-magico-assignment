/**
 * Detect cycles in a directed graph using DFS
 * @param {string} taskId - The task being updated
 * @param {string[]} newDependencies - New dependency IDs
 * @param {Map} adjacencyMap - Map of taskId -> [dependencyIds]
 * @returns {{ hasCycle: boolean, cycle: string[] }}
 */
const detectCycle = (taskId, newDependencies, adjacencyMap) => {
  // Build a temporary graph with the proposed change
  const graph = new Map(adjacencyMap);
  graph.set(taskId, newDependencies);

  const visited = new Set();
  const recursionStack = new Set();
  const cyclePath = [];

  const dfs = (nodeId) => {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    cyclePath.push(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        cyclePath.push(neighbor);
        return true;
      }
    }

    recursionStack.delete(nodeId);
    cyclePath.pop();
    return false;
  };

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      if (dfs(node)) {
        return { hasCycle: true, cycle: cyclePath };
      }
    }
  }

  return { hasCycle: false, cycle: [] };
};

/**
 * Build adjacency map from list of tasks
 */
const buildAdjacencyMap = (tasks) => {
  const map = new Map();
  for (const task of tasks) {
    map.set(
      task._id.toString(),
      (task.dependencies || []).map(d => d.toString())
    );
  }
  return map;
};

/**
 * Topological sort using Kahn's algorithm
 * Returns sorted order or null if cycle exists
 */
const topologicalSort = (tasks) => {
  const taskMap = new Map();
  const inDegree = new Map();
  const adjList = new Map();

  for (const task of tasks) {
    const id = task._id.toString();
    taskMap.set(id, task);
    inDegree.set(id, 0);
    adjList.set(id, []);
  }

  for (const task of tasks) {
    const id = task._id.toString();
    for (const dep of (task.dependencies || [])) {
      const depId = dep.toString();
      if (adjList.has(depId)) {
        adjList.get(depId).push(id);
        inDegree.set(id, (inDegree.get(id) || 0) + 1);
      }
    }
  }

  const queue = [];
  for (const [id, degree] of inDegree.entries()) {
    if (degree === 0) queue.push(id);
  }

  const sorted = [];
  while (queue.length > 0) {
    const node = queue.shift();
    sorted.push(node);
    for (const neighbor of (adjList.get(node) || [])) {
      inDegree.set(neighbor, inDegree.get(neighbor) - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (sorted.length !== tasks.length) {
    return null; // cycle detected
  }

  return sorted.map(id => taskMap.get(id));
};

module.exports = { detectCycle, buildAdjacencyMap, topologicalSort };
