function isGraph(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.addUndirectedEdgeWithKey === "function" &&
    typeof value.dropNode === "function" &&
    typeof value.multi === "boolean"
  )
}

function copyNode(graph, key, attributes) {
  attributes = Object.assign({}, attributes)
  return graph.addNode(key, attributes)
}

function copyEdge(graph, undirected, key, source, target, attributes) {
  attributes = Object.assign({}, attributes)

  if (undirected) {
    if (key === null || key === undefined)
      return graph.addUndirectedEdge(source, target, attributes)
    else return graph.addUndirectedEdgeWithKey(key, source, target, attributes)
  } else {
    if (key === null || key === undefined)
      return graph.addDirectedEdge(source, target, attributes)
    else return graph.addDirectedEdgeWithKey(key, source, target, attributes)
  }
}

function DFSStack(graph) {
  this.graph = graph
  this.stack = new Array(graph.order)
  this.seen = new Set()
  this.size = 0
}

DFSStack.prototype.hasAlreadySeenEverything = function () {
  return this.seen.size === this.graph.order
}

DFSStack.prototype.countUnseenNodes = function () {
  return this.graph.order - this.seen.size
}

DFSStack.prototype.forEachNodeYetUnseen = function (callback) {
  var seen = this.seen
  var graph = this.graph

  graph.someNode(function (node, attr) {
    // Useful early exit for connected graphs
    if (seen.size === graph.order) return true // break

    // Node already seen?
    if (seen.has(node)) return false // continue

    var shouldBreak = callback(node, attr)

    if (shouldBreak) return true

    return false
  })
}

DFSStack.prototype.has = function (node) {
  return this.seen.has(node)
}

DFSStack.prototype.push = function (node) {
  var seenSizeBefore = this.seen.size

  this.seen.add(node)

  // If node was already seen
  if (seenSizeBefore === this.seen.size) return false

  this.stack[this.size++] = node

  return true
}

DFSStack.prototype.pushWith = function (node, item) {
  var seenSizeBefore = this.seen.size

  this.seen.add(node)

  // If node was already seen
  if (seenSizeBefore === this.seen.size) return false

  this.stack[this.size++] = item

  return true
}

DFSStack.prototype.pop = function () {
  if (this.size === 0) return

  return this.stack[--this.size]
}

/**
 * Function returning the largest component of the given graph.
 *
 * @param  {Graph} graph - Target graph.
 * @return {array}
 */
function largestConnectedComponent(graph) {
  if (!isGraph(graph))
    throw new Error(
      "graphology-components: the given graph is not a valid graphology instance.",
    )

  if (!graph.order) return []

  var stack = new DFSStack(graph)
  var push = stack.push.bind(stack)

  var largestComponent = []
  var component

  stack.forEachNodeYetUnseen(function (node) {
    component = []

    stack.push(node)

    var source

    while (stack.size !== 0) {
      source = stack.pop()

      component.push(source)

      graph.forEachNeighbor(source, push)
    }

    if (component.length > largestComponent.length) largestComponent = component

    // Early exit condition:
    // If current largest component's size is larger than the number of
    // remaining nodes to visit, we can safely assert we found the
    // overall largest component already.
    if (largestComponent.length > stack.countUnseenNodes()) return true

    return false
  })

  return largestComponent
}

/**
 * Function returning a subgraph composed of the largest component of the given graph.
 *
 * @param  {Graph} graph - Target graph.
 * @return {Graph}
 */
function largestConnectedComponentSubgraph(graph) {
  var component = largestConnectedComponent(graph)

  var S = graph.nullCopy()

  component.forEach(function (key) {
    copyNode(S, key, graph.getNodeAttributes(key))
  })

  graph.forEachEdge(function (
    key,
    attr,
    source,
    target,
    sourceAttr,
    targetAttr,
    undirected,
  ) {
    if (S.hasNode(source)) {
      copyEdge(S, undirected, key, source, target, attr)
    }
  })

  return S
}

function subgraph(graph, nodes) {
  if (!isGraph(graph))
    throw new Error("graphology-operators/subgraph: invalid graph instance.")

  var S = graph.nullCopy()

  var filterNode = nodes

  if (Array.isArray(nodes)) {
    if (nodes.length === 0) return S

    nodes = new Set(nodes)
  }

  if (nodes instanceof Set) {
    if (nodes.size === 0) return S

    filterNode = function (key) {
      return nodes.has(key)
    }

    // Ensuring given keys are casted to string
    var old = nodes
    nodes = new Set()

    old.forEach(function (node) {
      nodes.add("" + node)
    })
  }

  if (typeof filterNode !== "function")
    throw new Error(
      "graphology-operators/subgraph: invalid nodes. Expecting an array or a set or a filtering function.",
    )

  if (typeof nodes === "function") {
    graph.forEachNode(function (key, attr) {
      if (!filterNode(key, attr)) return

      copyNode(S, key, attr)
    })

    // Early termination
    if (S.order === 0) return S
  } else {
    nodes.forEach(function (key) {
      if (!graph.hasNode(key))
        throw new Error(
          'graphology-operators/subgraph: the "' +
            key +
            '" node was not found in the graph.',
        )

      copyNode(S, key, graph.getNodeAttributes(key))
    })
  }

  graph.forEachEdge(function (
    key,
    attr,
    source,
    target,
    sourceAttr,
    targetAttr,
    undirected,
  ) {
    if (!filterNode(source, sourceAttr)) return

    if (target !== source && !filterNode(target, targetAttr)) return

    copyEdge(S, undirected, key, source, target, attr)
  })

  return S
}

function StackSet() {
  this.set = new Set()
  this.stack = []
}

StackSet.prototype.has = function (value) {
  return this.set.has(value)
}

// NOTE: we don't check earlier existence because we don't need to
StackSet.prototype.push = function (value) {
  this.stack.push(value)
  this.set.add(value)
}

StackSet.prototype.pop = function () {
  this.set.delete(this.stack.pop())
}

StackSet.prototype.path = function (value) {
  return this.stack.concat(value)
}

StackSet.of = function (value, cycle) {
  var set = new StackSet()

  if (!cycle) {
    // Normally we add source both to set & stack
    set.push(value)
  } else {
    // But in case of cycle, we only add to stack so that we may reach the
    // source again (as it was not already visited)
    set.stack.push(value)
  }

  return set
}

function RecordStackSet() {
  this.set = new Set()
  this.stack = []
}

RecordStackSet.prototype.has = function (value) {
  return this.set.has(value)
}

// NOTE: we don't check earlier existence because we don't need to
RecordStackSet.prototype.push = function (record) {
  this.stack.push(record)
  this.set.add(record[1])
}

RecordStackSet.prototype.pop = function () {
  this.set.delete(this.stack.pop()[1])
}

RecordStackSet.prototype.path = function (record) {
  return this.stack
    .slice(1)
    .map(function (r) {
      return r[0]
    })
    .concat([record[0]])
}

RecordStackSet.of = function (value, cycle) {
  var set = new RecordStackSet()
  var record = [null, value]

  if (!cycle) {
    // Normally we add source both to set & stack
    set.push(record)
  } else {
    // But in case of cycle, we only add to stack so that we may reach the
    // source again (as it was not already visited)
    set.stack.push(record)
  }

  return set
}

/**
 * Function returning all the paths between source & target in the graph.
 *
 * @param  {Graph}   graph      - Target graph.
 * @param  {string}  source     - Source node.
 * @param  {string}  target     - Target node.
 * @param  {options} options    - Options:
 * @param  {number}    maxDepth   - Max traversal depth (default: infinity).
 * @return {array}              - The found paths.
 */
function allSimplePaths(graph, source, target, options) {
  if (!isGraph(graph))
    throw new Error(
      "graphology-simple-path.allSimplePaths: expecting a graphology instance.",
    )

  if (!graph.hasNode(source))
    throw new Error(
      'graphology-simple-path.allSimplePaths: expecting: could not find source node "' +
        source +
        '" in the graph.',
    )

  if (!graph.hasNode(target))
    throw new Error(
      'graphology-simple-path.allSimplePaths: expecting: could not find target node "' +
        target +
        '" in the graph.',
    )

  options = options || {}
  var maxDepth =
    typeof options.maxDepth === "number" ? options.maxDepth : Infinity

  source = "" + source
  target = "" + target

  var cycle = source === target

  var stack = [graph.outboundNeighbors(source)]
  var visited = StackSet.of(source, cycle)

  var paths = []
  var p

  var children, child

  while (stack.length !== 0) {
    children = stack[stack.length - 1]
    child = children.pop()

    if (!child) {
      stack.pop()
      visited.pop()
    } else {
      if (visited.has(child)) continue

      if (child === target) {
        p = visited.path(child)
        paths.push(p)
      }

      visited.push(child)

      if (!visited.has(target) && stack.length < maxDepth)
        stack.push(graph.outboundNeighbors(child))
      else visited.pop()
    }
  }

  return paths
}
