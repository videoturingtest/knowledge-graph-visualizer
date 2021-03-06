import React, { Component } from 'react';
import { throttle } from 'throttle-debounce';
import * as d3 from 'd3';
import './Graph.css';

export default class Header extends Component {
  componentDidMount() {
    this.adjustViewBoxThr = throttle(500, this.adjustViewBox); 
    this.drawGraph();
    window.addEventListener('resize', this.handleResize);
  }

  componentDidUpdate(prevProps, prevState) {
    const { currentTime } = this.props;
    if (currentTime !== prevProps.currentTime) {
      this.updateGraph();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize = () => {
    this.adjustViewBoxThr();
  };

  adjustViewBox = () => {
    if (this.box && this.svg) {
      const boxWidth = this.box.clientWidth;
      const boxHeight = this.box.clientHeight;

      this.svg.attr('width', boxWidth)
        .attr('height', boxHeight)
        .attr('viewBox', [-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight])
    }
  };

  drawGraph() {
    const { graph } = this.props;

    this.data = {
      links: graph.links.map(d => Object.create(d)),
      nodes: graph.nodes.map(d => Object.create(d)),
    };

    this.simulation = this.forceSimulation(this.data.nodes, this.data.links).on("tick", () => this.ticked());

    const boxWidth = this.box.clientWidth;
    const boxHeight = this.box.clientHeight;

    this.svg = d3.select(this.box)
      .append('svg:svg')
      .attr('width', boxWidth)
      .attr('height', boxHeight)
      .attr('viewBox', [-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight]);

    this.svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 9)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 13)
      .attr('markerHeight', 13)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-2.5 L 5 ,0 L 0,2.5')
      .attr('fill', '#999')
      .style('stroke', 'none');

    this.drawLinks();
    this.drawNodes();

    return this.svg.node();
  }

  drawNodes() {
    const { currentTime } = this.props;

    this.node = this.svg.append('g')
      .attr('class', 'g-node')
      .selectAll('g')
      .data(this.data.nodes, d => d.id)
      .enter().append('g');

    this.nodeCircles = this.node.append('circle')
      .attr('r', 5)
      .attr('fill', d => `#${d.color}`)

    this.nodeLabels = this.node.append('text')
      .text(d => d.label)
      .attr('class', 'g-node-labels')
      .attr('x', 8)
      .attr('y', 3)

    this.node
      .style('opacity', d => d.isValid(currentTime) ? 1 : 0.05);

    this.node.call(this.drag(this.simulation));

    this.node.append('title')
      .text(d => d.label);
  }

  drawLinks() {
    const { currentTime } = this.props;

    this.link = this.svg.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(this.data.links, d => d.id)
      .enter().append('line')
      .style('stroke-dasharray', d => d.shape === 'dotted' ? '3,3' : '3,0')
      .attr('marker-end', d => d.shape === 'arrow' ? 'url(#arrowhead)' : '')
      .attr('stroke-width', d => Math.sqrt(d.value))
      .style('opacity', d => d.isValid(currentTime) ? 1 : 0.05);
  }

  update() {
    const { currentTime } = this.props;

    this.node
      .style('opacity', d => d.isValid(currentTime) ? 1 : 0.05);
    this.link
      .style('opacity', d => d.isValid(currentTime) ? 1 : 0.05);
  }

  updateGraph() {
    this.update();
  }

  ticked() {
    this.link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    this.node
      .attr('transform', d => `translate(${d.x}, ${d.y})`);
  }

  forceSimulation(nodes, links) {
    return d3.forceSimulation(nodes)
      .force(
        'link', 
        d3.forceLink(links)
          .id(d => d.id)
          .distance(d => 30)
      )
      .force('charge', d3.forceManyBody().strength(d => d.type !== 'property' ? -30 : -3))
      .force('collide', d3.forceCollide(d => 0))
      .force('x', d3.forceX())
      .force('y', d3.forceY());
  }

  color() {
    const scale = d3.scaleOrdinal(d3.schemeCategory10);
    return d => scale(d.group);
  }

  drag(simulation) {
    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  render() {
    return (
      <div className="Graph">
        <div 
          ref={e => (this.box = e)}
          className="Graph-box"
        >

        </div>
      </div>
    );
  }
}
