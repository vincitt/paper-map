---
id: vaswani-2017-transformer
title: "Attention Is All You Need"
label: "Transformer"
authors:
  - name: "Ashish Vaswani"
  - name: "Noam Shazeer"
  - name: "Niki Parmar"
  - name: "Jakob Uszkoreit"
  - name: "Llion Jones"
  - name: "Aidan N. Gomez"
  - name: "Łukasz Kaiser"
  - name: "Illia Polosukhin"
year: 2017
venue: "NeurIPS"
url: "https://arxiv.org/abs/1706.03762"
modality: "text"
methods: ["self-attention", "transformer"]
key_finding: "Replacing recurrence with pure self-attention sets new translation SOTA and parallelizes training."
builds_on: [bahdanau-2015-attention, sutskever-2014-seq2seq]
see_also: []
projects: ["Language line", "Survey/Bridges"]
datasets: [wmt14-ende, wmt14-enfr]
tasks: [machine-translation]
tools: [tensorflow]
status: verified
tags_provenance:
  - field: method
    value: "self-attention"
    source: abstract
    quote: "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely."
    by: human
  - field: key_finding
    value: "key_finding"
    source: results
    quote: "Our model achieves a new state of the art while being more parallelizable and requiring significantly less time to train."
    by: llm
    confidence: 0.96
added: 2026-06-25
updated: 2026-06-25
schema_version: "1.0"
---

## Abstract
Proposes the Transformer, a sequence-transduction architecture based solely on self-attention without recurrence or convolution, achieving state-of-the-art translation quality with far more parallelizable training.
