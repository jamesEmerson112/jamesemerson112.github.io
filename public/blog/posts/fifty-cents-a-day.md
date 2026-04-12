---
title: My Journey to Making $0.50 a Day
date: 2026-04-12
excerpt: My journey of making a product that generates 50 cents per day passively.
---

Today I want to talk about, or write about, my journey of making a product that generates 50 cents per day passively for me. That is the objective, simply.

The reason I began this journey is that I am constantly distracted by my responsibilities and by the pressures of being the man of the house. And the more distracted I am, the more likely I am to get swayed by temptation, which is basically what my brain assumes will bring the best profit to my family. But that is actually pretty dangerous, because technically, that is like selling my soul.

## So let's make it simple

I am, at the very least, an engineer, and I should build things that achieve certain objectives I have in mind. So how am I going to build a product that generates 50 cents per day for me?

There is a business that I'm familiar with, and they really do not use websites. They kind of do, but it is kind of pointless. I am thinking about generating a website for them that actually runs really fast. In exchange, when customers read the website, it would generate some sort of income for me.

## Checking the Traffic

Let me check how many people actually read the website that I previously built for this business.

Let's see. The reviews are pretty decent. I kind of stopped tracking who read this website a very long time ago. I wonder if I created a Square account for it. I might have created one. Maybe it can help me track how many people use the play button. Where do I see how busy the place is? Huh, it does not show me. That is very strange. It is Google Maps, right? Yeah, it is Google Maps. Logging... maybe my coding email. Let me double-check.

Oh, the traffic is pretty crazy. It is 105 visits per month, and there are about 93 unique visitors per month. That is pretty crazy. I like how it looks. Most of them are on mobile. Yeah, I mean, I actually built the website to be mobile-friendly, so that is really nice.

Yeah, I think I will recreate it.

## The Math

- ~100 views/month ≈ 3 views/day
- Objective: $0.50/day
- $0.50 ÷ 3 ≈ $0.17/view

```
Daily target  ████████████████  $0.50
              ─────┬──────┬─────
              view │ view │ view
              $0.17  $0.17  $0.17
```

A hundred views per month is basically around three views per day. That is the math. Let's say each view... well, our objective is 50 cents per day, right? So if that is only about one view every day, then each view would need to generate 50 cents for me somehow.

Wow, that is actually expensive. That is quite expensive. Building a website and expecting each view to generate 50 cents is pretty crazy. If I could get 100% more traffic per month, huh... very interesting.

## Scheduling Instead of Views

Now, I am just thinking aloud here. Viewing the website and generating 50 cents per user is a bit too crazy indeed. Unless I can create a scheduling system and turn it into an appointment experience, where I charge 50 cents per appointment, because users actually spend from around $50 to $150 per visit. So 50 cents per appointment is not too bad. Not too bad at all.

```
Today:    Customer ─▶ Slow PC ─▶ Schedule  ╳  Payment
                                    (disconnected)

Goal:     Customer ─▶ Tablet UI ─▶ Schedule ─▶ Payment ─▶ Record
```

But the problem is that the shop already has its own private scheduling system. It is actually not very optimized because the computer itself is quite slow. Previously, I wanted to create a scheduling app that is friendly for tablets. But that would mean the shop has to use the tablet, and the payment program is not really linked to scheduling in any useful way. So that is the problem I am trying to target.

Scheduling actually involves quite a lot of steps. I am familiar with appointment scheduling because, usually, scheduling an appointment comes with a product, and with that associated product, we also have a time slot. It is very consistent. What I mean by consistent is that everyone in the shop is already familiar with how appointment scheduling works. So if I switch the system, ideally the product should have the same mechanics and the same look. Also, when a customer pays, the money should go to the right record for that particular customer.

Now, when I think about the customer not being associated with the scheduling, what I mean is this: when scheduling an appointment for a customer, unless that customer is blacklisted, the receptionist generally does not care how much money the customer has spent. What I am trying to say is that every customer is king or queen, basically.

Obviously, we want to make sure everyone feels at home, especially the regulars. The regulars are the loyal customers of the shop, so we want the experience to be as pleasant as possible, right?

But I feel like I am yapping.

## Back to the Math

So my point is this: when a customer or unique user reads the website, making them generate 50 cents per read is a little bit crazy. Unless we can increase traffic from 100 users per month to maybe 500 users per month, then maybe we would only need around 10 cents per read, but even that still feels crazy.

```
Users/mo         Per-read cost needed
  100   █        ████████████████  $0.17
  200   ██       ████████           $0.08
  300   ███      █████              $0.05
  500   █████    ███                $0.03
```

This is a small business. Well, actually... maybe not that small. It generates around $150,000 to $200,000 per year, I think. So yeah, I am just trying to map it out. I am trying to see the shape of the problem.

> This is not a small, easy project. It is actually a little bit bigger than that.

## Staying Practical

In fact, maybe creating AI TikTok doomscrolling content would make more money. But let's stay practical, right?

Scheduling is actually a challenge when the shop is busy. The shop is not big enough for a full-time receptionist, so the shop has a kind of semi-employee, semi-receptionist doing the job. But still... why don't we start small, right?

## The Economics

Maybe 50 cents per day is a little too much as a starting point.

Let me see. 50 cents per day means about $5 every 10 days, which is about $15 per month. That is barely enough to run a website, unless I can host it locally. Putting it on Amazon Web Services would be cheap. Or maybe I already hosted the website for free. All I would need to do is purchase the domain. That is about $15 per year, not per month. Very interesting. Very interesting.

```
Revenue  $15.00/mo  ███████████████
Domain    $1.25/mo  █▎
Hosting   $0.00/mo  ·
─────────────────────────────────────
Profit   ~$13.75    █████████████▊
```

## What Users Actually Love

I think users love the current website. It is very simple. It is just the menu. The colors are easy on the eyes, the font is easy to read, and everything is straightforward.

Maybe we can add more features into it, but those extra features might load pretty slowly on a website, and even a split second of delay could make the user uncomfortable, frankly.

Yeah, I designed it to look nice on a phone, but let me see if I can improve it.

## The Real Challenges

Scheduling is tough, by the way, because I would need to create something that is easy to use on a tablet. Ideally, it would work well on an Apple device. But deploying an app would be difficult, so ideally, we would want the scheduling tool to be a full-stack web application instead.

Security is also an issue.

I think... if we can really make the scheduling experience easier and more fun—not fully automate it, but simplify it—then we can add a feature for customers to book their own appointments on the system. It is just easier that way.

I think the biggest challenge is actually the database migration. I think the app that the shop's computer uses might be difficult to migrate. There has to be a database somewhere, though, so I will look into it.

Oh, I was invited to a Gemini hackathon. Okay, no, no, no—it is just a message. It is not an invitation.

## So Let's Recreate It

So let's recreate the website.

Although... this cannot really be a 50-cent-per-day project unless it has ads on it. And if it has ads, then reading the website might become annoying for the user. That makes it difficult.

> 50 cents per day is more challenging than I thought.

## The Conclusion

And we are talking about 50 cents per day in profit. We want to provide value to the customer while also bringing ourselves profit. No one likes ads.

So the only thing that really makes sense is to use scheduling.

It is not an easy task, but it has to be done.

What if we create a very lightweight website and put the ads all the way at the bottom? Technically, users do not scroll all the way to the bottom.

Yeah... let's try that.
