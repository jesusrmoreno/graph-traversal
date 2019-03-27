import Iterator from "./Iterator";

export default class VertexFilter extends Iterator {
  _type = "VertexFilter";
  constructor(fn) {
    super();
    this.filter = fn;
  }
  results = () => {
    return [this.vx.filter(this.filter), this.ex];
  };
}
