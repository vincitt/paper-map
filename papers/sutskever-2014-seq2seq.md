---
id: sutskever-2014-seq2seq
title: "Sequence to Sequence Learning with Neural Networks"
label: "seq2seq"
authors:
  - name: "Ilya Sutskever"
  - name: "Oriol Vinyals"
  - name: "Quoc V. Le"
year: 2014
venue: "NeurIPS"
url: "https://arxiv.org/abs/1409.3215"
modality: "text"
methods: ["RNN", "LSTM", "encoder-decoder"]
key_finding: "An LSTM encoder–decoder maps whole sequences to sequences, enabling neural machine translation."
builds_on: []
see_also: [mikolov-2013-word2vec]
projects: ["Language line"]
datasets: [wmt14-enfr]
tasks: [machine-translation]
tools: [distbelief]
status: verified
tag_evidence:
  - field: method
    value: "LSTM"
    source: abstract
    quote: "We use a multilayered Long Short-Term Memory to map the input sequence to a vector of a fixed dimensionality."
    by: llm
    confidence: 0.92
added: 2026-06-25
updated: 2026-06-25
schema_version: "1.0"
---

## Abstract
Presents a general end-to-end sequence-to-sequence approach using multilayered LSTMs to encode an input sequence to a fixed vector and decode the target sequence, achieving strong machine-translation results.
