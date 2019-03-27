import shortid from "shortid";
import Graph from "./Graph";

export class Vertex {
  _id = shortid();
  
  constructor(g, type, label) {
    this.g = g;
    this.g.addV(this._id);
    this.g.addMeta(this._id, {
      type,
      label
    });
  }
  id = () => this._id;
  connect(label, v) {
    const edgeId = shortid();
    this.g.addE(edgeId);
    this.g.addMeta(edgeId, {
      source: this._id,
      target: v._id,
      label
    });

    return this;
  }

  property = (name, value) => {
    this.g.updateMeta(this._id, {
      [name]: value
    });
  };
}

export class GraphBuilderClass {
  vx = new Set();
  ex = new Set();

  meta = {};

  addV = (id) => this.vx.add(id);
  addE = (id) => this.ex.add(id);
  addMeta = (id, obj) => (this.meta[id] = obj);

  updateMeta = (id, obj) =>
    (this.meta[id] = Object.assign({}, this.meta[id], obj));

  vertex = (type, label) => {
    return new Vertex(this, type, label);
  };

  build = () => {
    return new Graph(
      Array.from(this.vx.values()),
      Array.from(this.ex.values()),
      {},
      this.meta
    );
  };
}

const GraphBuilder = () => new GraphBuilderClass();
export default GraphBuilder;
