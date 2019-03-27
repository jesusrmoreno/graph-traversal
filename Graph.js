import Traversal from "./Traversal";
import shortid from "shortid";
import keyBy from "lodash/keyBy";
import groupBy from "lodash/groupBy";

export default class Graph {
  _id = shortid();
  vx = [];
  ex = [];
  revision = 0;
  traversalGenerators = new Map();
  subscriptions = new Map();

  meta = {};
  props = {};

  vertexMap = new Map();

  /**
   * 
   * @param {string[]} vertices list of ids
   * @param {string[]} edges list of ids
   * @param {object{ [string]: any }} props will be set under the properties key
   * of the vertex 
   * i.e. vertex.properties.blah
   * @param {*} meta will be merged with the vertex
   * i.e. vertex.blah
   */
  constructor(vertices, edges, props, meta) {
    const [vx, ex] = this.createGraph(vertices, edges, props, meta);
    this.vx = vx;
    this.ex = ex;
    this.meta = {
      ...meta
    };
    this.props = {
      ...props
    };
  }

  // replace everything. this increases the revision number
  // good for using in react hooks
  update = (vertices, edges, props, meta) => {
    const [vx, ex] = this.createGraph(vertices, edges, props, meta);
    this.vx = vx;
    this.ex = ex;
    this.meta = {
      ...meta
    };
    this.props = {
      ...props
    };

    this.calculate();
    this.revision++;
  };

  createGraph = (vertices, edges, props, meta) => {
    const vx = vertices.map(_id => ({
      _id,
      label: meta[_id].label,
      properties: props[_id] || {},
      type: meta[_id].type || {},
      outEdges: [],
      inEdges: [],
      depth: meta[_id].depth || null
    }));
    const vxById = keyBy(vx, "_id");

    const ex = edges
      .map(_id => {
        const source = vxById[meta[_id].source];
        const target = vxById[meta[_id].target];
        if (!source || !target) {
          return null;
        }
        return {
          _id,
          ...meta[_id],
          source: vxById[meta[_id].source],
          target: vxById[meta[_id].target]
        };
      })
      .filter(Boolean);
    const exBySource = groupBy(ex, "source._id");
    const exByTarget = groupBy(ex, "target._id");
    vx.forEach(v => {
      v.outEdges = exBySource[v._id] || [];
      v.inEdges = exByTarget[v._id] || [];
    });
    this.vertexMap = { ...vxById };

    return [vx, ex];
  };

  getVertex = id => this.vertexMap[id] || null;

  
  traversalResults = new Map();

  getGraph = () => {
    return [this.vx, this.ex];
  };

  
  observeTraversal = (name, fn) => {
    const listeners = this.subscriptions.get(name) || new Set();
    listeners.add(fn);
    this.subscriptions.set(name, listeners);
    this.calculateTraversal(name);
  };

  unobserveTraversal = (name, fn) => {
    const listeners = this.subscriptions.get(name) || new Set();
    listeners.delete(fn);
    this.subscriptions.set(name, listeners);
  };

  calculateTraversal = (name) => {
    const traversal = this.traversalGenerators.get(name);
    if (traversal) {
      const subscriptions = this.subscriptions.get(name);
      if (subscriptions) {
        // probably shouldn't create a new one each time...? 
        // maybe check if the graph has actually changed via the revision
        const results = traversal(new Traversal(this.vx, this.ex)).subgraph();
        this.traversalResults.set(name, results);
        for (let fn of Array.from(subscriptions.values())) {
          fn(...results);
        }
      }
    }
  };

  getMeta = () => ({ ...this.meta });
  getProps = () => ({ ...this.props });

  calculate = () => {
    for (let name of Array.from(this.traversalGenerators.keys())) {
      this.calculateTraversal(name);
    }
  };

  traversal = () => new Traversal(this.vx, this.ex);

  addObservableTraversal = (name, fn) => {
    if (this.traversalGenerators.get(name) !== fn) {
      this.traversalGenerators.set(name, fn);
    }
  };
}
