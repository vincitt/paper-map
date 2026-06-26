---
id: krizhevsky-2012-imagenet
title: "ImageNet Classification with Deep Convolutional Neural Networks"
label: "AlexNet"
authors:
  - name: "Alex Krizhevsky"
  - name: "Ilya Sutskever"
  - name: "Geoffrey Hinton"
year: 2012
venue: "NeurIPS"
url: "https://papers.nips.cc/paper/4824"
modality: "vision"
methods: ["CNN", "dropout"]
key_finding: "A large GPU-trained CNN with dropout and ReLU roughly halved ImageNet error."
builds_on: [lecun-1998-gradient, hinton-2006-fast]
see_also: []
projects: ["Vision line"]
datasets: [imagenet]
tasks: [image-classification]
tools: [cuda-convnet]
status: verified
tag_evidence:
  - field: method
    value: "dropout"
    source: methods
    quote: "Recently-developed regularization method called dropout proved very effective at reducing overfitting."
    by: llm
    confidence: 0.9
  - field: key_finding
    value: "key_finding"
    source: abstract
    quote: "On the test data we achieved top-5 error rates considerably better than the previous state of the art."
    by: human
added: 2026-06-25
updated: 2026-06-25
schema_version: "1.0"
---

## Abstract
Trains a large deep convolutional network (AlexNet) on ImageNet using ReLU units, GPU training, and dropout regularization, dramatically lowering top-5 error and igniting the deep-learning era for vision.
