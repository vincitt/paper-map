---
id: mikolov-2013-word2vec
title: "Efficient Estimation of Word Representations in Vector Space"
label: "word2vec"
authors:
  - name: "Tomáš Mikolov"
  - name: "Kai Chen"
  - name: "Greg Corrado"
  - name: "Jeffrey Dean"
year: 2013
venue: "ICLR Workshop"
url: "https://arxiv.org/abs/1301.3781"
modality: "text"
methods: ["word embeddings"]
key_finding: "Shallow log-linear models learn high-quality word vectors at scale, cheaply."
builds_on: []
see_also: []
projects: ["Language line"]
datasets: [google-news]
tasks: [word-representation]
tools: []
status: verified
tags_provenance:
  - field: method
    value: "word embeddings"
    source: abstract
    quote: "We propose two novel model architectures for computing continuous vector representations of words from very large data sets."
    by: llm
    confidence: 0.94
added: 2026-06-25
updated: 2026-06-25
schema_version: "1.0"
---

## Abstract
Proposes the continuous bag-of-words and skip-gram architectures (word2vec) for learning distributed word representations efficiently from very large corpora.
