---
title: Hello World
date: 2026-03-22
excerpt: First post on the new technical blog. A quick intro to what I'll be writing about.
---

# Hello World

Welcome to my technical blog. I'll be writing about topics at the intersection of neuroscience and machine learning — the two fields I'm most passionate about.

## What to expect

I plan to cover things like:

- **Neural network architectures** and how they relate to biological neural circuits
- **Research papers** I find interesting, with breakdowns and commentary
- **Side projects** and technical deep-dives into problems I'm solving
- **Tools and workflows** that help me stay productive

## A quick code example

Here's a simple Python snippet to get things started:

```python
import torch
import torch.nn as nn

class SimpleNet(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, output_dim),
        )

    def forward(self, x):
        return self.layers(x)
```

More posts coming soon. Stay tuned.
