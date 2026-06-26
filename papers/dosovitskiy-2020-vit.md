---
id: dosovitskiy-2020-vit
title: "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale"
authors:
  - name: "Alexey Dosovitskiy"
  - name: "Lucas Beyer"
  - name: "Alexander Kolesnikov"
  - name: "Dirk Weissenborn"
  - name: "Xiaohua Zhai"
  - name: "Neil Houlsby"
year: 2021
venue: "ICLR"
url: "https://arxiv.org/abs/2010.11929"
modality: "vision"
methods: ["transformer", "self-attention"]
key_finding: "A pure Transformer over image patches matches CNNs at scale, bridging vision and language."
builds_on: [vaswani-2017-transformer, krizhevsky-2012-imagenet]
see_also: []
projects: ["Vision line", "Survey/Bridges"]
datasets: [imagenet, jft300m]
tasks: [image-classification]
tools: [jax]
status: verified
tags_provenance:
  - field: method
    value: "transformer"
    source: abstract
    quote: "A pure transformer applied directly to sequences of image patches can perform very well on image classification tasks."
    by: human
added: 2026-06-25
updated: 2026-06-25
schema_version: "1.0"
---

## Abstract
Applies a standard Transformer directly to sequences of image patches (Vision Transformer), showing that with large-scale pretraining it matches or exceeds convolutional networks on image classification.
