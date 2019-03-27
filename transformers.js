import memoize from "lodash/memoize";

export const vertexToD3 = memoize(v => {
  return {
    _id: v._id,
    type: v.type,
    inDegree: v.inEdges ? v.inEdges.length : 0,
    outDegree: v.outEdges ? v.outEdges.length : 0,
    depth: v.depth
  };
});

export const edgeToD3 = memoize(e => {
  return {
    source: e.source._id,
    target: e.target._id,
    _id: e._id
  };
});

export const vertexIdToD3 = memoize((id, type) => ({
  _id: id,
  type,
  inDegree: 0,
  outDegree: 0
}));

export const edgeIdToD3 = (id, meta) => {
  return {
    _id: id,
    source: meta[id].source,
    target: meta[id].target
  };
};
