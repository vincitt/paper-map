---
id: devlin-2018-bert
title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding"
authors:
  - name: "Jacob Devlin"
  - name: "Ming-Wei Chang"
  - name: "Kenton Lee"
  - name: "Kristina Toutanova"
year: 2018
venue: "NAACL"
url: "https://arxiv.org/abs/1810.04805"
modality: "text"
methods: ["transformer", "masked language modeling", "pretraining"]
key_finding: "Masked bidirectional pretraining of a Transformer yields a general-purpose language encoder."
builds_on: [vaswani-2017-transformer]
see_also: []
projects: ["Language line"]
datasets: [bookcorpus, wikipedia]
tasks: [language-modeling, language-understanding]
tools: [tensorflow]
status: unverified
tags_provenance:
  - field: method
    value: "masked language modeling"
    source: abstract
    quote: "BERT is designed to pretrain deep bidirectional representations by jointly conditioning on both left and right context."
    by: llm
    confidence: 0.9
added: 2026-06-25
updated: 2026-06-25
schema_version: "1.0"
---

## Abstract
Introduces BERT, which pretrains deep bidirectional Transformer representations using a masked-language-modeling objective, then fine-tunes to state-of-the-art results across many language-understanding tasks.

## Notes
Drafted by LLM — verify the methods tags and the builds_on link before reviewing.
