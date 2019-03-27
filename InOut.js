import Iterator from "./Iterator";
import keyBy from "lodash/keyBy";

export default class InOut extends Iterator {
  _type = "";
  edgeFilter = () => true;
  vertexFilter = () => true;

  constructor(
    edgeFilterFn = () => true,
    vertexFilterFn = () => true,
    type,
    depth = 1
  ) {
    super();
    this._type = type;
    this.edgeFilter = edgeFilterFn;
    this.vertexFilter = vertexFilterFn;
    this.depth = depth;
  }

  // Very quick and dirty BFS with support for stopping at specific depth
  results = () => {
    const vxById = keyBy(this.vx, "_id");
    const tv = new Set(this.vx.map(v => v._id));
    const addedVX = new Map();
    const addedEX = new Map();
    let children = 0;
    let layerCount = tv.size;
    let layers = 0;

    if (this.type() === "out") {
      for (let i = 0; i < tv.size; i++) {
        if (layers < this.depth) {
          const ids = Array.from(tv.values());
          const _id = ids[i];
          const v = vxById[_id];
          for (const e of v.outEdges) {
            const u = e.target;
            if (!u) {
              console.log(e);
            }
            vxById[u._id] = u;
            const includeTarget = this.vertexFilter(u);
            const includeEdge = includeTarget && this.edgeFilter(e);
            if (includeEdge) {
              if (!tv.has(v._id)) {
                addedVX.set(v._id, v);
              }

              if (!tv.has(u._id)) {
                tv.add(u._id);
                addedVX.set(u._id, u);
              }

              addedEX.set(e._id, e);
              children++;
            }
          }
          layerCount--;
          if (layerCount === 0) {
            layers++;
            layerCount = children;
          }
        }
      }
    }

    if (this.type() === "in") {
      for (let i = 0; i < tv.size; i++) {
        if (layers < this.depth) {
          const ids = Array.from(tv.values());
          const _id = ids[i];
          const v = vxById[_id];
          for (const e of v.inEdges) {
            const u = e.source;
            if (!u) {
              console.log(e);
            }
            vxById[u._id] = u;
            const includeTarget = this.vertexFilter(u);
            const includeEdge = includeTarget && this.edgeFilter(e);
            if (includeEdge) {
              if (!tv.has(v._id)) {
                addedVX.set(v._id, v);
              }

              if (!tv.has(u._id)) {
                tv.add(u._id);
                addedVX.set(u._id, u);
              }

              addedEX.set(e._id, e);
              children++;
            }
          }
          layerCount--;
          if (layerCount === 0) {
            layers++;
            layerCount = children;
          }
        }
      }
    }

    // We should only be passing the discovered vertices and edges onwards
    return [Array.from(addedVX.values()), Array.from(addedEX.values())];
  };
}

export const outE = (
  edgeFilterFn = () => true,
  vertexFilterFn = () => true
) => () => new InOut(edgeFilterFn, vertexFilterFn, "out");

export const inE = (
  edgeFilterFn = () => true,
  vertexFilterFn = () => true
) => () => new InOut(edgeFilterFn, vertexFilterFn, "in");
