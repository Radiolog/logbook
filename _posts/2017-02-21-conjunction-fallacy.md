---
layout: post
title: Linda and the Conjunction Fallacy
tags: [random]
description: Do you know Linda?
comments: true
date:  2017-02-21 14:25:38
---


<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script> 
<script type="text/javascript" src="https://ajax.aspnetcdn.com/ajax/globalize/0.1.1/globalize.min.js"></script>
<script type="text/javascript" src="https://unpkg.com/survey-jquery"></script>
<script type="text/javascript" src="https://cdn3.devexpress.com/jslib/15.1.5/js/dx.chartjs.js"></script>

The conjunction fallacy is a formal fallacy that occurs when it is assumed that specific conditions are more probable than a single general one.

The most often-cited example of this fallacy originated with Amos Tversky and Daniel Kahneman:

<div id="surveyContainer"></div>
<div id="chartContainer"></div>
<script type="text/javascript" src="/logbook/public/js/survey/survey.js"></script>

The majority of those asked chose option 2. However, the probability of two events occurring together (in "conjunction") is always less than or equal to the probability of either one occurring alone—formally, for two events A and B this inequality could be written as 

$$ P(A \cap B) \leq P(A)$$ and $$P(A \cap B) \leq P(B) $$ 

For example, even choosing a very low probability of Linda being a bank teller, say Pr(Linda is a bank teller) = 0.05 and a high probability that she would be a feminist, say Pr(Linda is a feminist) = 0.95, then, assuming independence, Pr(Linda is a bank teller and Linda is a feminist) = 0.05 × 0.95 or 0.0475, lower than Pr(Linda is a bank teller).

Tversky and Kahneman argue that most people get this problem wrong because they use a heuristic (an easily calculated procedure) called representativeness to make this kind of judgment: Option 2 seems more "representative" of Linda based on the description of her, even though it is clearly mathematically less likely.

In other demonstrations, they argued that a specific scenario seemed more likely because of representativeness, but each added detail would actually make the scenario less and less likely. In this way it could be similar to the misleading vividness or slippery slope fallacies. More recently Kahneman has argued that the conjunction fallacy is a type of extension neglect.

<div id="chartText" style ="visibility: hidden"></div>
