import Iterator from "./Iterator";
import VertexFilter from "./VertexFilter";
import InOut from "./InOut";
import shortid from "shortid";
import get from "lodash/get";
import { vertexToD3, edgeToD3 } from "./transformers";
import { Until } from "./Until";

/**
 * The Traversal class is the core of our graph exploration toolset
 *
 * Each traversal, subscription or otherwise starts with the passed in vertices
 * and edges
 *
 * Traversals started off of the Graph class will have the entire vertex / edge set
 * passed in.
 *
 * The traversal keeps a linked list of each iterator instance,
 * these iterators are not actually called until the
 * execute method is called on the Traversal class.
 *
 * When the execute method (or a method that calls the execute method) is called
 * each iterator receives the results of the previous iterator in the chain as
 * input.
 *
 * e.g.
 * // set the initial vertices and edges, these will not be included in the final gr
 * const t = new Traversal(vertices, edges)
 *    .has(v => v.type === "person")
 *    .out(e => e.label.includes('bought'))
 *    .in(e => e.label.includes('likes'), v = v.type === 'person')
 *
 * // at this point the traversal has not been executed
 *
 * const results = t.run(); // results now contains [vx, ex];
 */
export default class Traversal {
  _id = shortid();
  spent = false;
  startIterator = new Iterator();
  currentIterator = this.startIterator;
  vx = [];
  ex = [];

  results = [[], []];
  constructor(vx, ex) {
    // We don't include the edges as part of the start iterator because
    // we want to build them up using out / in calls.
    // we do however want to start things out with all of the vertices
    // so the has iterator can filter them down.
    if (vx) {
      this.vx = vx;
      this.startIterator.setVertices(vx);
    }
    this.startIterator.setEdges(ex ? ex : []);
  }

  addIterator = i => {
    if (this.currentIterator) {
      this.currentIterator.setNext(i);
      this.currentIterator = i;
    }
  };

  has = (fn = () => true) => {
    this.addIterator(new VertexFilter(fn));
    return this;
  };

  out = (edgeFilterFn, vertexFilterFn) => {
    const efn = edgeFilterFn ? edgeFilterFn : () => true;
    const vfn = vertexFilterFn ? vertexFilterFn : () => true;
    const out = new InOut(efn, vfn, "out");
    this.addIterator(out);
    return this;
  };

  repeat = (fn, times) => {
    for (let i = 0; i < times; i++) {
      const it = fn(i);
      this.addIterator(it);
    }
    return this;
  };

  in = (edgeFilterFn, vertexFilterFn) => {
    const efn = edgeFilterFn ? edgeFilterFn : () => true;
    const vfn = vertexFilterFn ? vertexFilterFn : () => true;
    const inIt = new InOut(efn, vfn, "in");
    this.addIterator(inIt);
    return this;
  };

  while = (fn, condition = () => false) => {
    this.addIterator(new Until(fn, condition));
    return this;
  };

  countV = () => {
    return this.run()[0].length;
  };

  countE = () => {
    return this.run()[1].length;
  };

  front = () => {
    this.run();
    return [Array.from(this.frontV.values()), []];
  };
  frontV = new Map();

  frontAsD3 = () => {
    this.run();
    const [vx, ex] = [Array.from(this.frontV.values()), []];
    return [vx.map(vertexToD3), ex.map(edgeToD3)];
  };

  subgraph = () => {
    return this.run();
  };

  subgraphAsD3 = () => {
    const [vx, ex] = this.run();
    return [vx.map(vertexToD3), ex.map(edgeToD3)];
  };

  run = () => {
    // don't re-run the traversal if we've already been run
    if (this.spent) return this.results;

    let rvx = new Map();
    let rex = new Map();

    for (
      let current = this.startIterator;
      current !== null;
      current = current.next()
    ) {
      const next = current.next();
      if (!next) {
        const [vv, ee] = current.results();

        vv.forEach(v => rvx.set(v._id, v));
        vv.forEach(v => this.frontV.set(v._id, v));
        ee.forEach(v => rex.set(v._id, v));
        break;
      } else {
        const [vx, ex] = current.results();
        if (current.type() !== "all") {
          vx.forEach(v => rvx.set(v._id, v));
          ex.forEach(v => rex.set(v._id, v));
        }

        // set the inputs to the next iterator to the results of this iterator
        // basically creating a funnel
        next.setEdges(ex);
        next.setVertices(vx);
      }
    }

    const ex = Array.from(rex.values()).filter(e => {
      const isIncluded = rvx.has(e.source._id) && rvx.has(e.target._id);
      if (!isIncluded) {
        rex.delete(e._id);
      }
      return isIncluded;
    });

    this.results = [
      Array.from(rvx.values()).map(v => {
        return {
          ...v,
          inEdges: v.inEdges.filter(e => rex.has(e._id)),
          outEdges: v.outEdges.filter(e => rex.has(e._id))
        };
      }),
      ex
    ];
    return this.results;
  };
}
