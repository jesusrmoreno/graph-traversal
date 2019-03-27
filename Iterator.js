import shortid from "shortid";

export default class Iterator {
  _id = shortid();
  _type = "all";
  _next = null;
  vx = [];
  ex = [];

  setNext = i => (this._next = i);

  setVertices = vx => {
    this.vx = vx;
    return this;
  };

  setEdges = ex => {
    this.ex = ex;
    return this;
  };

  id = () => this._id;

  type = () => this._type;

  next = () => {
    return this._next;
  };

  results = () => {
    return [this.vx, this.ex];
  };
}
