---
layout: post
title: Portfolio Optimization using Quandl, Bokeh and Gurobi 
tags: [economics, python, jupyter]
comments: true
date:  2016-11-19 14:25:38
description: Looking for the minimum risk portfolio? Here is a way to find it using [Quandl](https://www.quandl.com), [Bokeh](http://bokeh.pydata.org/en/latest/) and [Gurobi](http://www.gurobi.com).
---

{% capture content %}{% highlight python %}
import pandas as pd
import numpy as np
from math import sqrt
import sys
from bokeh.plotting import figure, show, ColumnDataSource, save
from bokeh.models import Range1d, HoverTool
from bokeh.io import output_notebook, output_file
import quandl
from gurobipy import *
# output_notebook() #To enable Bokeh output in notebook, uncomment this line
{% endhighlight %}{% endcapture %}
{% include notebook-cell.html execution_count="[1]:" content=content type='input' %}

This post shows how we can optimize our portfolio using [Quandl](https://www.quandl.com), [Bokeh](http://bokeh.pydata.org/en/latest/) and [Gurobi](http://www.gurobi.com)[^1]. First of all, we need some data to proceed. The corresponding jupyter notebook [can be downloaded here.](https://github.com/mxbu/logbook/blob/gh-pages/blog-notebooks/optimization.ipynb) For that purpose we use Quandl, more precisely you're going to need the quandl package. This isn't totally necessary, as pulling from the API is quite simple with or without the package, but it does make it a bit easier and knocks out a few steps. The Quandl package can be [downloaded here](https://github.com/quandl/quandl-python). If quandl is set up, next thing to do is to choose some stocks to import. The following is a random selection of american and erupean stocks. Note: `.4` in the quandl code specifies that we want the closed price.

{% capture content %}{% highlight python %}
APIToken = "Your-API-Token"

quandlcodes = ["GOOG/NASDAQ_AAPL.4","WIKI/GOOGL.4", "GOOG/NASDAQ_CSCO.4","GOOG/NASDAQ_FB.4",
"GOOG/NASDAQ_MSFT.4","GOOG/NASDAQ_TSLA.4","GOOG/NASDAQ_YHOO.4","GOOG/PINK_CSGKF.4",
"YAHOO/F_EOAN.4","YAHOO/F_BMW.4","YAHOO/F_ADS.4","GOOG/NYSE_ABB.4","GOOG/VTX_ADEN.4",
"GOOG/VTX_NOVN.4","GOOG/VTX_HOLN.4","GOOG/NYSE_UBS.4", "GOOG/NYSE_SAP.4", "YAHOO/SW_SNBN.4",
"YAHOO/IBM.4", "YAHOO/RIG.4" , "YAHOO/CTXS.4", "YAHOO/INTC.4","YAHOO/KO.4",
"YAHOO/NKE.4","YAHOO/MCD.4","YAHOO/EBAY.4","GOOG/VTX_NESN.4","YAHOO/MI_ALV.4","YAHOO/AXAHF.4",
"GOOG/VTX_SREN.4"]
{% endhighlight %}{% endcapture %}
{% include notebook-cell.html execution_count="[2]:" content=content type='input' %}

The command to import those stocks is `quandl.get()`. With `trim_start` and `trim_end` we can choose a desired time horizon.

{% capture content %}{% highlight python %}
data = quandl.get(quandlcodes,authtoken=APIToken, trim_start='2009-01-01', trim_end='2016-11-09', paginate=True, per_end_date={'gte': '2009-01-01'},
                  qopts={'columns':['ticker', 'per_end_date']})

{% endhighlight %}{% endcapture %}
{% include notebook-cell.html execution_count="[3]:" content=content type='input' %}

Let's now calculate the growth rates and some stats:

{% capture content %}{% highlight python %}
GrowthRates = data.pct_change()*100
syms = GrowthRates.columns
Sigma = GrowthRates.cov()
stats = pd.concat((GrowthRates.mean(),GrowthRates.std()),axis=1)
stats.columns = ['Mean_return', 'Volatility']
extremes = pd.concat((stats.idxmin(),stats.min(),stats.idxmax(),stats.max()),axis=1)
extremes.columns = ['Minimizer','Minimum','Maximizer','Maximum']
stats
{% endhighlight %}{% endcapture %}
{% include notebook-cell.html execution_count="[4]:" content=content type='input' %}
{% capture content %}
<div style="overflow-x: auto;-webkit-overflow-scrolling: touch;">
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>Mean_return</th>
      <th>Volatility</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>GOOG/NASDAQ_AAPL - Close</th>
      <td>0.125833</td>
      <td>1.726076</td>
    </tr>
    <tr>
      <th>WIKI/GOOGL - Close</th>
      <td>0.069063</td>
      <td>1.967627</td>
    </tr>
    <tr>
      <th>GOOG/NASDAQ_CSCO - Close</th>
      <td>0.047938</td>
      <td>1.731333</td>
    </tr>
    <tr>
      <th>GOOG/NASDAQ_FB - Close</th>
      <td>0.136107</td>
      <td>2.556192</td>
    </tr>
    <tr>
      <th>GOOG/NASDAQ_MSFT - Close</th>
      <td>0.069622</td>
      <td>1.602043</td>
    </tr>
    <tr>
      <th>GOOG/NASDAQ_TSLA - Close</th>
      <td>0.184646</td>
      <td>3.345699</td>
    </tr>
    <tr>
      <th>GOOG/NASDAQ_YHOO - Close</th>
      <td>0.081633</td>
      <td>2.021945</td>
    </tr>
    <tr>
      <th>GOOG/PINK_CSGKF - Close</th>
      <td>0.000057</td>
      <td>2.690247</td>
    </tr>
    <tr>
      <th>YAHOO/F_EOAN - Close</th>
      <td>-0.057462</td>
      <td>1.879740</td>
    </tr>
    <tr>
      <th>YAHOO/F_BMW - Close</th>
      <td>0.082739</td>
      <td>2.040693</td>
    </tr>
    <tr>
      <th>YAHOO/F_ADS - Close</th>
      <td>0.094261</td>
      <td>1.729286</td>
    </tr>
    <tr>
      <th>GOOG/NYSE_ABB - Close</th>
      <td>0.035269</td>
      <td>1.884311</td>
    </tr>
    <tr>
      <th>GOOG/VTX_ADEN - Close</th>
      <td>0.041308</td>
      <td>1.933576</td>
    </tr>
    <tr>
      <th>GOOG/VTX_NOVN - Close</th>
      <td>0.021955</td>
      <td>1.184016</td>
    </tr>
    <tr>
      <th>GOOG/VTX_HOLN - Close</th>
      <td>0.017115</td>
      <td>2.011954</td>
    </tr>
    <tr>
      <th>GOOG/NYSE_UBS - Close</th>
      <td>0.036881</td>
      <td>2.706204</td>
    </tr>
    <tr>
      <th>GOOG/NYSE_SAP - Close</th>
      <td>0.056749</td>
      <td>1.628628</td>
    </tr>
    <tr>
      <th>YAHOO/SW_SNBN - Close</th>
      <td>0.035416</td>
      <td>1.782714</td>
    </tr>
    <tr>
      <th>YAHOO/IBM - Close</th>
      <td>0.037257</td>
      <td>1.290793</td>
    </tr>
    <tr>
      <th>YAHOO/RIG - Close</th>
      <td>-0.041073</td>
      <td>2.869053</td>
    </tr>
    <tr>
      <th>YAHOO/CTXS - Close</th>
      <td>0.088172</td>
      <td>2.216246</td>
    </tr>
    <tr>
      <th>YAHOO/INTC - Close</th>
      <td>0.054862</td>
      <td>1.617349</td>
    </tr>
    <tr>
      <th>YAHOO/KO - Close</th>
      <td>0.010891</td>
      <td>1.522319</td>
    </tr>
    <tr>
      <th>YAHOO/NKE - Close</th>
      <td>0.031609</td>
      <td>2.284062</td>
    </tr>
    <tr>
      <th>YAHOO/MCD - Close</th>
      <td>0.035156</td>
      <td>1.033587</td>
    </tr>
    <tr>
      <th>YAHOO/EBAY - Close</th>
      <td>0.067272</td>
      <td>2.389571</td>
    </tr>
    <tr>
      <th>GOOG/VTX_NESN - Close</th>
      <td>0.031053</td>
      <td>1.026613</td>
    </tr>
    <tr>
      <th>YAHOO/MI_ALV - Close</th>
      <td>0.053178</td>
      <td>2.010690</td>
    </tr>
    <tr>
      <th>YAHOO/AXAHF - Close</th>
      <td>0.027366</td>
      <td>2.623103</td>
    </tr>
    <tr>
      <th>GOOG/VTX_SREN - Close</th>
      <td>0.053448</td>
      <td>2.192983</td>
    </tr>
  </tbody>
</table>
</div>
{% endcapture %}
{% include notebook-cell.html execution_count="[4]:" content=content type='output' %}

As we move towards the Markowitz portfolio designs it makes sense to view the stocks on a mean/variance scatter plot. 

{% capture content %}{% highlight python %}
fig = figure(tools="pan,box_zoom,reset,resize")
source = ColumnDataSource(stats)
hover = HoverTool(tooltips=[('Symbol','@index'),('Volatility','@Volatility'),('Mean return','@Mean_return')])
fig.add_tools(hover)
fig.circle('Volatility', 'Mean_return', size=5, color='maroon', source=source)
fig.text('Volatility', 'Mean_return', syms, text_font_size='10px', x_offset=3, y_offset=-2, source=source)
fig.xaxis.axis_label='Volatility (standard deviation)'
fig.yaxis.axis_label='Mean return'
output_file("portfolio.html")
show(fig)
{% endhighlight %}{% endcapture %}
{% include notebook-cell.html execution_count="[5]:" content=content type='input' %}


You should see a graph here, if not, please <a  style="box-sizing: border-box; cursor: pointer; background: #f0f0f0;" onclick="PageReload()">
<span>refresh the page.</span>
</a>

<html lang="en">
<head>
<meta charset="utf-8">
<title>Bokeh Plot</title>

<link rel="stylesheet" href="/logbook/public/css/bokeh/bokeh.css" type="text/css" />

<script type="text/javascript" src="/logbook/public/js/optimization-bokeh/bokeh.min.js"></script>

<script type="text/javascript">
Bokeh.set_log_level("info");
</script>
<style>
html {
width: 100%;
height: 90%;
}
body {
width: 100%;
height: 100%;
margin: auto;
}
</style>
</head>
<body>

<div class="bk-root">
<div class="plotdiv" id="f9ebb182-2c71-4a89-86f2-16a28620dc7d"></div>
</div>

<script>loadJSDeferred('/logbook/public/js/optimization-bokeh/bokeh01.js');</script>

</body>
</html>



### Gurobi

Time to bring in the big guns. But first of all some notes about installing the gurobi python module. Its very easy if you use [Anaconda](https://www.continuum.io/downloads), the "leading open data science platform powered by Python":

* Install Gurobi:              `conda install gurobi` 
* Retrieve license:            `grbgetkey  xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx ` 
* Test license:                `>>> import gurobipy`

As an academic you can use Gurobi for free, just make an account and get a key.


Expressed in mathematical terms, we will be solving models in this form:

$$\begin{array}{lll}
\text{minimize}   & x^T \Sigma x \\
\text{subject to} & \sum_i x_i = 1 & \text{fixed budget} \\
                  & r^T x = \gamma & \text{fixed return} \\
                  & x \geq 0
\end{array}$$

In this model, the optimization variable $$x\in\mathbb{R}^N$$ is a vector representing the fraction of the budget allocated to each stock; that is, $$x_i$$ is the amount allocated to stock $$i$$. The paramters of the model are the mean returns $$r$$, a *covariance matrix* $$\Sigma$$, and the target return $$\gamma$$. What we will do is sweep $$\gamma$$ between the worst and best returns we have seen above, and compute the portfolio that achieves the target return but with as little risk as possible.

The *covariance matrix* $$\Sigma$$ merits some explanation. Along the diagonal, it contains the squares of the volatilities (standard deviations) computed above. But off the diagonal, it contains measures of the *correlation* between two stocks: that is, whether they tend to move in the same direction (positive correlation), in opposite directions (negative correlation), or a mixture of both (small correlation). This entire matrix is computed with a single call to Pandas.

### Building the base model

We are not solving just one model here, but literally hundreds of them, with different return targets and with the short constraints added or removed. One very nice feature of the Gurobi Python interface is that we can build a single "base" model, and reuse it for each of these scenarios by adding and removing constraints.

First, let's initialize the model and declare the variables. As we mentioned above, we're creating separate variables for the long and short positions. We put these variables into a Pandas DataFrame for easy organization, and create a third column that holds the difference between the long and short variables---that is, the net allocations for each stock. Another nice feature of Gurobi's Python interface is that the variable objects can be used in simple linear and quadratic expressions using familar Python syntax.

{% capture content %}{% highlight python %}
# Instantiate our model
m = Model("portfolio")

# Create one variable for each stock
portvars = [m.addVar(name=symb,lb=0.0) for symb in syms]
portvars[7]=m.addVar(name='GOOG/PINK_CSGKF - Close',lb=0.0,ub=0.5)
portvars = pd.Series(portvars, index=syms)
portfolio = pd.DataFrame({'Variables':portvars})

# Commit the changes to the model
m.update()

# The total budget
p_total = portvars.sum()

# The mean return for the portfolio
p_return = stats['Mean_return'].dot(portvars)

# The (squared) volatility of the portfolio
p_risk = Sigma.dot(portvars).dot(portvars)

# Set the objective: minimize risk
m.setObjective(p_risk, GRB.MINIMIZE)

# Fix the budget
m.addConstr(p_total, GRB.EQUAL, 1)

# Select a simplex algorithm (to ensure a vertex solution)
m.setParam('Method', 1)

m.optimize()
{% endhighlight %}{% endcapture %}
{% include notebook-cell.html execution_count="[6]:" content=content type='input' %}


<pre class="stream">
Changed value of parameter Method to 1
   Prev: -1  Min: -1  Max: 4  Default: -1
Optimize a model with 1 rows, 31 columns and 30 nonzeros
Model has 465 quadratic objective terms
Coefficient statistics:
  Matrix range     [1e+00, 1e+00]
  Objective range  [0e+00, 0e+00]
  QObjective range [5e-04, 2e+01]
  Bounds range     [5e-01, 5e-01]
  RHS range        [1e+00, 1e+00]
Presolve removed 0 rows and 1 columns
Presolve time: 0.01s
Presolved: 1 rows, 30 columns, 30 nonzeros
Presolved model has 465 quadratic objective terms

Iteration    Objective       Primal Inf.    Dual Inf.      Time
       0    0.0000000e+00   0.000000e+00   0.000000e+00      0s
      12    4.9948178e-01   0.000000e+00   0.000000e+00      0s

Solved in 12 iterations and 0.02 seconds
Optimal objective  4.994817828e-01
</pre>


### Minimum Risk Model
We have set our objective to minimize risk, and fixed our budget at 1. The model we solved above gave us the minimum risk model.

{% capture content %}{% highlight python %}
portfolio['Minimum risk'] = portvars.apply(lambda x:x.getAttr('x'))
portfolio
{% endhighlight %}{% endcapture %}
{% include notebook-cell.html execution_count="[7]:" content=content type='input' %}
{% capture content %}
<div style="overflow-x: auto;-webkit-overflow-scrolling: touch;">
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>Variables</th>
      <th>Minimum risk</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>GOOG/NASDAQ_AAPL - Close</th>
      <td>&lt;gurobi.Var GOOG/NASDAQ_AAPL - Close (value 0....</td>
      <td>0.019100</td>
    </tr>
    <tr>
      <th>WIKI/GOOGL - Close</th>
      <td>&lt;gurobi.Var WIKI/GOOGL - Close (value 0.003253...</td>
      <td>0.003253</td>
    </tr>
    <tr>
      <th>GOOG/NASDAQ_CSCO - Close</th>
      <td>&lt;gurobi.Var GOOG/NASDAQ_CSCO - Close (value 0.0)&gt;</td>
      <td>0.000000</td>
    </tr>
    <tr>
      <th>GOOG/NASDAQ_FB - Close</th>
      <td>&lt;gurobi.Var GOOG/NASDAQ_FB - Close (value 0.02...</td>
      <td>0.024476</td>
    </tr>
    <tr>
      <th>GOOG/NASDAQ_MSFT - Close</th>
      <td>&lt;gurobi.Var GOOG/NASDAQ_MSFT - Close (value 0.0)&gt;</td>
      <td>0.000000</td>
    </tr>
    <tr>
      <th>GOOG/NASDAQ_TSLA - Close</th>
      <td>&lt;gurobi.Var GOOG/NASDAQ_TSLA - Close (value 0.0)&gt;</td>
      <td>0.000000</td>
    </tr>
    <tr>
      <th>GOOG/NASDAQ_YHOO - Close</th>
      <td>&lt;gurobi.Var GOOG/NASDAQ_YHOO - Close (value 0.0)&gt;</td>
      <td>0.000000</td>
    </tr>
    <tr>
      <th>GOOG/PINK_CSGKF - Close</th>
      <td>&lt;gurobi.Var GOOG/PINK_CSGKF - Close (value 0.0)&gt;</td>
      <td>0.000000</td>
    </tr>
    <tr>
      <th>YAHOO/F_EOAN - Close</th>
      <td>&lt;gurobi.Var YAHOO/F_EOAN - Close (value 0.0)&gt;</td>
      <td>0.000000</td>
    </tr>
    <tr>
      <th>YAHOO/F_BMW - Close</th>
      <td>&lt;gurobi.Var YAHOO/F_BMW - Close (value 0.0)&gt;</td>
      <td>0.000000</td>
    </tr>
    <tr>
      <th>YAHOO/F_ADS - Close</th>
      <td>&lt;gurobi.Var YAHOO/F_ADS - Close (value 0.00280...</td>
      <td>0.002803</td>
    </tr>
    <tr>
      <th>GOOG/NYSE_ABB - Close</th>
      <td>&lt;gurobi.Var GOOG/NYSE_ABB - Close (value 0.0)&gt;</td>
      <td>0.000000</td>
    </tr>
    <tr>
      <th>GOOG/VTX_ADEN - Close</th>
      <td>&lt;gurobi.Var GOOG/VTX_ADEN - Close (value 0.0)&gt;</td>
      <td>0.000000</td>
    </tr>
    <tr>
      <th>GOOG/VTX_NOVN - Close</th>
      <td>&lt;gurobi.Var GOOG/VTX_NOVN - Close (value 0.124...</td>
      <td>0.124355</td>
    </tr>
    <tr>
      <th>GOOG/VTX_HOLN - Close</th>
      <td>&lt;gurobi.Var GOOG/VTX_HOLN - Close (value 0.0)&gt;</td>
      <td>0.000000</td>
    </tr>
    <tr>
      <th>GOOG/NYSE_UBS - Close</th>
      <td>&lt;gurobi.Var GOOG/NYSE_UBS - Close (value 0.0)&gt;</td>
      <td>0.000000</td>
    </tr>
    <tr>
      <th>GOOG/NYSE_SAP - Close</th>
      <td>&lt;gurobi.Var GOOG/NYSE_SAP - Close (value 0.0)&gt;</td>
      <td>0.000000</td>
    </tr>
    <tr>
      <th>YAHOO/SW_SNBN - Close</th>
      <td>&lt;gurobi.Var YAHOO/SW_SNBN - Close (value 0.146...</td>
      <td>0.146450</td>
    </tr>
    <tr>
      <th>YAHOO/IBM - Close</th>
      <td>&lt;gurobi.Var YAHOO/IBM - Close (value 0.0895428...</td>
      <td>0.089543</td>
    </tr>
    <tr>
      <th>YAHOO/RIG - Close</th>
      <td>&lt;gurobi.Var YAHOO/RIG - Close (value 0.0)&gt;</td>
      <td>0.000000</td>
    </tr>
    <tr>
      <th>YAHOO/CTXS - Close</th>
      <td>&lt;gurobi.Var YAHOO/CTXS - Close (value 0.0)&gt;</td>
      <td>0.000000</td>
    </tr>
    <tr>
      <th>YAHOO/INTC - Close</th>
      <td>&lt;gurobi.Var YAHOO/INTC - Close (value 0.0)&gt;</td>
      <td>0.000000</td>
    </tr>
    <tr>
      <th>YAHOO/KO - Close</th>
      <td>&lt;gurobi.Var YAHOO/KO - Close (value 0.08424357...</td>
      <td>0.084244</td>
    </tr>
    <tr>
      <th>YAHOO/NKE - Close</th>
      <td>&lt;gurobi.Var YAHOO/NKE - Close (value 0.0)&gt;</td>
      <td>0.000000</td>
    </tr>
    <tr>
      <th>YAHOO/MCD - Close</th>
      <td>&lt;gurobi.Var YAHOO/MCD - Close (value 0.2588231...</td>
      <td>0.258823</td>
    </tr>
    <tr>
      <th>YAHOO/EBAY - Close</th>
      <td>&lt;gurobi.Var YAHOO/EBAY - Close (value 0.0)&gt;</td>
      <td>0.000000</td>
    </tr>
    <tr>
      <th>GOOG/VTX_NESN - Close</th>
      <td>&lt;gurobi.Var GOOG/VTX_NESN - Close (value 0.246...</td>
      <td>0.246953</td>
    </tr>
    <tr>
      <th>YAHOO/MI_ALV - Close</th>
      <td>&lt;gurobi.Var YAHOO/MI_ALV - Close (value 0.0)&gt;</td>
      <td>0.000000</td>
    </tr>
    <tr>
      <th>YAHOO/AXAHF - Close</th>
      <td>&lt;gurobi.Var YAHOO/AXAHF - Close (value 0.0)&gt;</td>
      <td>0.000000</td>
    </tr>
    <tr>
      <th>GOOG/VTX_SREN - Close</th>
      <td>&lt;gurobi.Var GOOG/VTX_SREN - Close (value 0.0)&gt;</td>
      <td>0.000000</td>
    </tr>
  </tbody>
</table>
</div>
{% endcapture %}
{% include notebook-cell.html execution_count="[7]:" content=content type='output' %}

{% capture content %}{% highlight python %}
# Add the return target
ret50 = 0.5 * extremes.loc['Mean_return','Maximum']
fixreturn = m.addConstr(p_return, GRB.EQUAL, ret50)

m.optimize()

portfolio['50% Max'] = portvars.apply(lambda x:x.getAttr('x'))

{% endhighlight %}{% endcapture %}
{% include notebook-cell.html execution_count="[8]:" content=content type='input' %}

<pre class="stream">
Optimize a model with 2 rows, 31 columns and 60 nonzeros
Model has 465 quadratic objective terms
Coefficient statistics:
  Matrix range     [6e-05, 1e+00]
  Objective range  [0e+00, 0e+00]
  QObjective range [5e-04, 2e+01]
  Bounds range     [5e-01, 5e-01]
  RHS range        [9e-02, 1e+00]
Iteration    Objective       Primal Inf.    Dual Inf.      Time
       0    0.0000000e+00   0.000000e+00   0.000000e+00      0s
      11    9.5121296e-01   0.000000e+00   0.000000e+00      0s

Solved in 11 iterations and 0.01 seconds
Optimal objective  9.512129585e-01
</pre>


### The efficient frontier

Now what we're going to do is sweep our return target over a range of values, starting at the smallest possible value  to the largest. For each, we construct the minimum-risk portfolio. This will give us a tradeoff curve that is known in the business as the *efficient frontier* or the *Pareto-optimal curve*.

Note that we're using the *same model object* we've already constructed! All we have to do is set the return target and re-optimize for each value of interest.

{% capture content %}{% highlight python %}
m.setParam('OutputFlag',False)

# Determine the range of returns. Make sure to include the lowest-risk
# portfolio in the list of options
minret = extremes.loc['Mean_return','Minimum']
maxret = extremes.loc['Mean_return','Maximum']
riskret = extremes.loc['Volatility','Minimizer']
riskret = stats.loc[riskret,'Mean_return']
riskret =sum(portfolio['Minimum risk']*stats['Mean_return'])
returns = np.unique(np.hstack((np.linspace(minret,maxret,10000),riskret)))


# Iterate through all returns
risks = returns.copy()
for k in range(len(returns)):
    fixreturn.rhs = returns[k]
    m.optimize()
    risks[k] = sqrt(p_risk.getValue())
{% endhighlight %}{% endcapture %}
{% include notebook-cell.html execution_count="[9]:" content=content type='input' %}

{% capture content %}{% highlight python %}
fig = figure(tools="pan,box_zoom,reset,resize")

# Individual stocks
fig.circle(stats['Volatility'], stats['Mean_return'], size=5, color='maroon')
fig.text(stats['Volatility'], stats['Mean_return'], syms, text_font_size='10px', x_offset=3, y_offset=-2)
fig.circle('Volatility', 'Mean_return', size=5, color='maroon', source=source)
# Divide the efficient frontier into two sections: those with
# a return less than the minimum risk portfolio, those that are greater.
tpos_n = returns >= riskret
tneg_n = returns <= riskret
fig.line(risks[tneg_n], returns[tneg_n], color='red')
fig.line(risks[tpos_n], returns[tpos_n], color='blue')

fig.xaxis.axis_label='Volatility (standard deviation)'
fig.yaxis.axis_label='Mean return'
fig.legend.orientation='bottom_left'
output_file("efffront.html")
show(fig) 
{% endhighlight %}{% endcapture %}
{% include notebook-cell.html execution_count="[10]:" content=content type='input' %}


You should see a graph here, if not, please <a  style="box-sizing: border-box; cursor: pointer; background: #f0f0f0;" onclick="PageReload()">
<span>refresh the page.</span>
</a>
<script>
function PageReload() {
    location.reload(true);
}
</script>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Bokeh Plot</title>


<script type="text/javascript">
Bokeh.set_log_level("info");
</script>
<style>
html {
width: 100%;
height: 90%;
}
body {
width: 100%;
height: 100%;
margin: auto;
}
</style>
</head>
<body>

<div class="bk-root">
<div class="plotdiv" id="bfa5134b-d217-48cb-b87b-e3a4ff3608d7"></div>
</div>

<script>loadJSDeferred('/recordsblog/public/js/optimization-bokeh/bokeh02.js');</script>
</body>
</html>

[^1]: Borrowed and updated from Michael C. Grant, [Continuum Analytics](http://continuum.io)
