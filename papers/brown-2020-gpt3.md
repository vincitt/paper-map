---
id: brown-2020-gpt3
title: "Language Models are Few-Shot Learners"
authors:
  - name: "Tom B. Brown"
  - name: "Benjamin Mann"
  - name: "Nick Ryder"
  - name: "Jared Kaplan"
  - name: "Ilya Sutskever"
  - name: "Dario Amodei"
year: 2020
venue: "NeurIPS"
url: "https://arxiv.org/abs/2005.14165"
modality: "text"
methods: ["transformer", "in-context learning"]
key_finding: "Scaling a Transformer LM to 175B parameters enables few-shot learning with no gradient updates."
builds_on: [vaswani-2017-transformer, devlin-2018-bert]
see_also: []
projects: ["Language line"]
datasets: [common-crawl, wikipedia]
tasks: [language-modeling]
tools: []
status: unverified
tags_provenance:
  - field: method
    value: "in-context learning"
    source: abstract
    quote: "GPT-3 is applied without any gradient updates or fine-tuning, with tasks specified purely via text interaction with the model."
    by: llm
    confidence: 0.88
added: 2026-06-25
updated: 2026-06-25
schema_version: "1.0"
---

## Abstract
Shows that scaling an autoregressive Transformer language model (GPT-3, 175B parameters) lets it perform many tasks from a few in-context examples without any gradient-based fine-tuning.

## Notes
Drafted by LLM — author list truncated to a representative subset; confirm modality.
