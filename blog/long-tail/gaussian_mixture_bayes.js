window.addEventListener("load", () => {
  let container = document.getElementById("figure2");

  const n_samples = 300;
  const n_classes = 3;
  const colors = ["#E69F00", "#56B4E9", "#009E73"];
  const means_class = [[0,3.5], [-2,0], [2,0]];
  const cov_class = [
    math.matrix([[1,0],[0,1]]),
    math.matrix([[0.5,0],[0,0.5]]),
    math.matrix([[0.5,0],[0,0.5]])
  ];

  function randn_bm() {
    let u=0,v=0; while(u===0) u=Math.random(); while(v===0) v=Math.random();
    return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
  }

  let X=[],y=[];
  for(let i=0;i<n_classes;i++){
    const L = math.cholesky(cov_class[i]);
    for(let j=0;j<n_samples/3;j++){
      const z=math.matrix([randn_bm(),randn_bm()]);
      const x=math.add(math.multiply(L,z),means_class[i]);
      X.push(x._data);
      y.push(i);
    }
  }

  let traces=[];
  for(let i=0;i<n_classes;i++){
    const Xi=X.filter((_,idx)=>y[idx]===i);
    traces.push({
      x: Xi.map(d=>d[0]),
      y: Xi.map(d=>d[1]),
      mode: 'markers',
      type: 'scatter',
      marker: {color: colors[i], size:6},
      name:`Class ${i}`
    });
  }

  const layout={title:"Gaussian Mixture Scatter", width:800, height:600};
  Plotly.newPlot(container, traces, layout);
});
