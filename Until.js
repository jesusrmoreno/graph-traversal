import Iterator from "./Iterator";

export class Until extends Iterator {
  _type = "Until";

  constructor(iteratorFn, shouldStop = () => false) {
    super();
    this.iteratorFn = iteratorFn;
    this.shouldStop = shouldStop;
  }

  results = () => {
    let rvx = new Map();
    let rex = new Map();

    let inputs = [this.vx, this.ex];
    let res = [[], []];
    for (let i = 0; i < 100; i++) {
      let [vx, ex] = inputs;
      const results = this.iteratorFn()
        .setEdges(ex)
        .setVertices(vx)
        .results();

      if (results[0].length === 0 && results[1].length === 0) {
        return res;
      } else {
        const [vv, ee] = results;
        vv.forEach(v => rvx.set(v._id, v));
        ee.forEach(v => rex.set(v._id, v));
        const ex = Array.from(rex.values()).filter(e => {
          const isIncluded = rvx.has(e.source._id) && rvx.has(e.target._id);
          if (!isIncluded) {
            rex.delete(e._id);
          }
          return isIncluded;
        });

        inputs = results;
        res = [
          Array.from(rvx.values()).map(v => {
            return {
              ...v,
              inEdges: v.inEdges.filter(e => rex.has(e._id)),
              outEdges: v.outEdges.filter(e => rex.has(e._id))
            };
          }),
          ex
        ];
      }
    }

    return res;
  };
}
