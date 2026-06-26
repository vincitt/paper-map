---
id: lecun-1998-gradient
title: "Gradient-Based Learning Applied to Document Recognition"
label: "LeNet"
authors:
  - name: "Yann LeCun"
  - name: "Léon Bottou"
  - name: "Yoshua Bengio"
  - name: "Patrick Haffner"
year: 1998
venue: "Proceedings of the IEEE"
doi: "10.1109/5.726791"
modality: "vision"
methods: ["CNN", "backpropagation"]
key_finding: "End-to-end trained convolutional networks beat hand-engineered features for document recognition."
builds_on: []
see_also: []
projects: ["Foundations", "Vision line"]
datasets: [mnist]
tasks: [image-classification]
tools: []
status: verified
tags_provenance:
  - field: method
    value: "CNN"
    source: abstract
    quote: "Convolutional neural networks are specifically designed to deal with the variability of 2-D shapes."
    by: llm
    confidence: 0.95
  - field: key_finding
    value: "key_finding"
    source: results
    quote: "Better pattern recognition systems can be built by relying more on automatic learning and less on hand-designed heuristics."
    by: human
added: 2026-06-25
updated: 2026-06-25
schema_version: "1.0"
---

## Abstract
Reviews gradient-based learning for pattern recognition and shows that convolutional neural networks trained by backpropagation outperform hand-designed feature pipelines on handwritten digit and document recognition.
