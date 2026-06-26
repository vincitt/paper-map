---
id: bahdanau-2015-attention
title: "Neural Machine Translation by Jointly Learning to Align and Translate"
label: "Bahdanau"
authors:
  - name: "Dzmitry Bahdanau"
  - name: "Kyunghyun Cho"
  - name: "Yoshua Bengio"
year: 2015
venue: "ICLR"
url: "https://arxiv.org/abs/1409.0473"
modality: "text"
methods: ["attention", "encoder-decoder", "RNN"]
key_finding: "Letting the decoder attend over source positions removes seq2seq's fixed-vector bottleneck."
builds_on: [sutskever-2014-seq2seq]
see_also: []
projects: ["Language line"]
datasets: [wmt14-enfr]
tasks: [machine-translation]
tools: [theano]
status: flagged
tags_provenance:
  - field: method
    value: "attention"
    source: abstract
    quote: "The model (soft-)searches for a set of positions in a source sentence where the most relevant information is concentrated."
    by: llm
    confidence: 0.91
added: 2026-06-25
updated: 2026-06-25
schema_version: "1.0"
---

## Abstract
Introduces an attention mechanism that lets a neural translation model softly search the source sentence for relevant positions when generating each target word, improving translation of long sentences.

## Notes
Review: confirm whether to add a see_also link to word2vec; double-check author affiliations before marking reviewed.
