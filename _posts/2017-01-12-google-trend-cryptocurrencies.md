---
layout: post
title: Has google predictive power for the price of cryptocurrencies?
tags: [economics, python, jupyter, cryptocurrency]
comments: true
description: In today's post I want to examine whether Google Trend data has predictive power for cryptocurrencies. That, by carry out some VARs. The results are not really meaningful, maybe due to the reason that a price cannot really be forecasted by the amount of google searches, however we see how to use the pytrends package.
date:  2017-01-12 20:14:07
---
In today's post I want to examine whether Google Trend data has predictive power for cryptocurrencies. That, by carry out some VARs. The corresponding jupyter notebook can be [downloaded from github.](https://github.com/mxbu/logbook/blob/gh-pages/blog-notebooks/google-trend.ipynb) This includes the use of pytrends to import google trend data into python. The Prices of the cryptocurrencies(here Bitcoin/EUR, Ethereum/BTC and Zcash/BTC) are taken from quandl with the use of the quandl API for python. So let's start importing the necessary packages.

{% capture content %}{% highlight python %}
from pytrends.request import TrendReq
import statsmodels.api as sm
import matplotlib.pyplot as plt
import pandas as pd
import datetime
import quandl
{% endhighlight %}{% endcapture %}
{% include notebook-cell.html execution_count="[1]:" content=content type='input' %}

To make use of the pytrends packages you need a google account, otherwise it won't work, I suppose. Quandl also wants an API token, such that you can fetch an unlimited amount of data. Thus, we define the necessary credentials, start and end date and the quandl codes to fetch the data. Please note here: If we want to analyze the data on a daily basis, it's only possible for the last 90 days. Google only reports daily search volume for the last 90 days, if we define a longer time horizon, google would return weekly data. This is a pity but anyway, let's continue. 

{% capture content %}{% highlight python %}
google_username = 'xxxxx@gmail.com'
google_password = "xxxxx"
QuandlToken = "xxx-xxxxx"
EndDate = datetime.datetime.now().date()
StartDate = EndDate - datetime.timedelta(days=89)
quandlcodes = ["GDAX/EUR.1","BITFINEX/ETHBTC.4", "BITFINEX/ZECBTC.4"]
{% endhighlight %}{% endcapture %}
{% include notebook-cell.html execution_count="[2]:" content=content type='input' %}

I choose the way to import each currency separately, such that every currency reaches somewhere the maximum value of 100 in the google statistics. Otherwise(all imported together) only bitcoin would reach this maximum value and zcash had a 0 most of the time. This would look like the following:

{% capture content %}{% highlight python %}
data = quandl.get(quandlcodes,authtoken=QuandlToken, trim_start=StartDate, trim_end=EndDate, paginate=True, 
qopts={'columns':['ticker', 'per_end_date']})

# connect to Google
pytrend = TrendReq(google_username, google_password, custom_useragent=None)

trend_payload = {'q': 'Bitcoin','date': 'today 90-d'}
gtrendbtc = pytrend.trend(trend_payload, return_type='dataframe')
trend_payload = {'q': 'Ethereum','date': 'today 90-d'}
gtrendeth = pytrend.trend(trend_payload, return_type='dataframe')
trend_payload = {'q': 'Zcash','date': 'today 90-d'}
gtrendzec = pytrend.trend(trend_payload, return_type='dataframe')
gtrend = pd.concat([gtrendbtc, gtrendeth, gtrendzec], axis = 1) 

trend_payload = {'q': 'Bitcoin, Ethereum, Zcash','date': 'today 90-d'}
gtrendall = pytrend.trend(trend_payload, return_type='dataframe')
{% endhighlight %}{% endcapture %}
{% include notebook-cell.html execution_count="[3]:" content=content type='input' %}

{% capture content %}{% highlight python %}
# Graph
fig, ax = plt.subplots(1,figsize=(12,6))
ax.grid()
ax.plot(gtrendall)
ax.legend(list(gtrendall.columns),loc=2)
plt.show(fig)
{% endhighlight %}{% endcapture %}
{% include notebook-cell.html execution_count="[4]:" content=content type='input' %}
![png](/logbook/public/img/google-trend/image1.png)

For the analysis we convert the prices to Euro and calculate growth rates of the google trend statistics:

{% capture content %}{% highlight python %}
DF = pd.concat([gtrend, data], axis = 1) 
AllData = DF.dropna()
AllData.iloc[:,4] =  AllData.iloc[:,4]*AllData.iloc[:,3] 
AllData.iloc[:,5] =  AllData.iloc[:,5]*AllData.iloc[:,3] 
AllData.columns = ['bitcoin', 'ethereum', 'zcash','BTC/EUR', 'ETH/EUR','ZEC/EUR']
prcntdta = AllData.pct_change()*100
AllData.corr()
{% endhighlight %}{% endcapture %}
{% include notebook-cell.html execution_count="[5]:" content=content type='input' %}
<pre class="stream">
/Users/anaconda/lib/python3.5/site-packages/pandas/core/indexing.py:549: SettingWithCopyWarning: 
A value is trying to be set on a copy of a slice from a DataFrame.
Try using .loc[row_indexer,col_indexer] = value instead

See the caveats in the documentation: http://pandas.pydata.org/pandas-docs/stable/indexing.html#indexing-view-versus-copy
self.obj[item_labels[indexer[info_axis]]] = value
</pre>
{% capture content %}
<div style="overflow-x: auto;-webkit-overflow-scrolling: touch;">
<table border="1" class="dataframe">
<thead>
<tr style="text-align: right;">
<th></th>
<th>bitcoin</th>
<th>ethereum</th>
<th>zcash</th>
<th>BTC/EUR</th>
<th>ETH/EUR</th>
<th>ZEC/EUR</th>
</tr>
</thead>
<tbody>
<tr>
<th>bitcoin</th>
<td>1.000000</td>
<td>0.703493</td>
<td>-0.220455</td>
<td>0.834460</td>
<td>0.084882</td>
<td>-0.179142</td>
</tr>
<tr>
<th>ethereum</th>
<td>0.703493</td>
<td>1.000000</td>
<td>-0.054122</td>
<td>0.514216</td>
<td>0.073768</td>
<td>-0.097767</td>
</tr>
<tr>
<th>zcash</th>
<td>-0.220455</td>
<td>-0.054122</td>
<td>1.000000</td>
<td>-0.453619</td>
<td>0.461441</td>
<td>0.767814</td>
</tr>
<tr>
<th>BTC/EUR</th>
<td>0.834460</td>
<td>0.514216</td>
<td>-0.453619</td>
<td>1.000000</td>
<td>-0.233093</td>
<td>-0.382175</td>
</tr>
<tr>
<th>ETH/EUR</th>
<td>0.084882</td>
<td>0.073768</td>
<td>0.461441</td>
<td>-0.233093</td>
<td>1.000000</td>
<td>0.397930</td>
</tr>
<tr>
<th>ZEC/EUR</th>
<td>-0.179142</td>
<td>-0.097767</td>
<td>0.767814</td>
<td>-0.382175</td>
<td>0.397930</td>
<td>1.000000</td>
</tr>
</tbody>
</table>
</div>
{% endcapture %}
{% include notebook-cell.html execution_count="[5]:" content=content type='output' %}

From the previous table, we see that those time series are highly correlated. Now let's see some graphs 

{% capture content %}{% highlight python %}
# Graph
fig, ax = plt.subplots(2,figsize=(12,6))
ax[0].grid()
ax[0].plot(prcntdta.iloc[:,0])
ax[0].legend(["%-Change in Google Trend Search"],loc=2)
ax[1].plot(AllData.iloc[:,3])
ax[1].grid()
ax[1].legend(['BTC/EUR'],loc=2)
plt.show(fig)
{% endhighlight %}{% endcapture %}
{% include notebook-cell.html execution_count="[6]:" content=content type='input' %}
![png](/logbook/public/img/google-trend/image2.png)

{% capture content %}{% highlight python %}
fig, ax = plt.subplots(2,figsize=(12,6))
ax[0].grid()
ax[0].plot(prcntdta.iloc[:,1])
ax[0].legend(["%-Change in Google Trend Search"],loc=2)
ax[1].plot(AllData.iloc[:,4])
ax[1].grid()
ax[1].legend(['ETH/EUR'],loc=2)
plt.show(fig)
{% endhighlight %}{% endcapture %}
{% include notebook-cell.html execution_count="[7]:" content=content type='input' %}
![png](/logbook/public/img/google-trend/image3.png)

{% capture content %}{% highlight python %}
fig, ax = plt.subplots(2,figsize=(12,6))
ax[0].grid()
ax[0].plot(prcntdta.iloc[:,2])
ax[0].legend(["%-Change in Google Trend Search"],loc=2)
ax[1].plot(AllData.iloc[:,5])
ax[1].grid()
ax[1].legend(['ZEC/EUR'],loc=2)
plt.show(fig)
{% endhighlight %}{% endcapture %}
{% include notebook-cell.html execution_count="[8]:" content=content type='input' %}
![png](/logbook/public/img/google-trend/image4.png)

Now let's try to quantify the connection between the google trends statistics growth rate and price of the currency. That is we estimate bivariate VARs of order 1. The following are the results of these VARs:

{% capture content %}{% highlight python %}
# Statespace
dta = pd.concat([AllData['BTC/EUR'].iloc[2:74],prcntdta['bitcoin'].iloc[2:74]], axis=1)
mod = sm.tsa.VARMAX(dta,  order=(1,0), enforce_invertibility=True)
res = mod.fit(maxiter=5000, disp = False)
print(res.summary())
{% endhighlight %}{% endcapture %}
{% include notebook-cell.html execution_count="[9]:" content=content type='input' %}
<pre class="stream">
/Users/anaconda/lib/python3.5/site-packages/statsmodels/tsa/base/tsa_model.py:229: ValueWarning: A date index has been provided, but it has no associated frequency information and so will be ignored when e.g. forecasting.
' ignored when e.g. forecasting.', ValueWarning)
</pre>
<pre class="stream">
Statespace Model Results                             
==================================================================================
Dep. Variable:     ['BTC/EUR', 'bitcoin']   No. Observations:                   72
Model:                             VAR(1)   Log Likelihood                -619.689
+ intercept   AIC                           1257.377
Date:                    Fri, 13 Jan 2017   BIC                           1277.867
Time:                            20:11:55   HQIC                          1265.535
Sample:                                 0                                         
- 72                                         
Covariance Type:                      opg                                         
===================================================================================
Ljung-Box (Q):                20.29, 32.78   Jarque-Bera (JB):       207.19, 118.43
Prob(Q):                        1.00, 0.78   Prob(JB):                   0.00, 0.00
Heteroskedasticity (H):         5.09, 4.18   Skew:                      -1.23, 1.58
Prob(H) (two-sided):            0.00, 0.00   Kurtosis:                  10.94, 8.43
Results for equation BTC/EUR                         
==============================================================================
coef    std err          z      P>|z|      [0.025      0.975]
------------------------------------------------------------------------------
const          5.7239     17.375      0.329      0.742     -28.330      39.778
L1.BTC/EUR     0.9954      0.021     46.650      0.000       0.954       1.037
L1.bitcoin     0.6420      0.286      2.242      0.025       0.081       1.203
Results for equation bitcoin                         
==============================================================================
coef    std err          z      P>|z|      [0.025      0.975]
------------------------------------------------------------------------------
const         -3.0087     11.536     -0.261      0.794     -25.618      19.601
L1.BTC/EUR     0.0058      0.015      0.390      0.697      -0.023       0.035
L1.bitcoin    -0.0180      0.135     -0.134      0.894      -0.282       0.246
Error covariance matrix                                   
============================================================================================
coef    std err          z      P>|z|      [0.025      0.975]
--------------------------------------------------------------------------------------------
sqrt.var.BTC/EUR            26.2152      1.603     16.349      0.000      23.072      29.358
sqrt.cov.BTC/EUR.bitcoin     0.6536      2.624      0.249      0.803      -4.488       5.796
sqrt.var.bitcoin            11.6858      0.769     15.191      0.000      10.178      13.194
============================================================================================

Warnings:
[1] Covariance matrix calculated using the outer product of gradients (complex-step).
</pre>

{% capture content %}{% highlight python %}
# Statespace
dta = pd.concat([AllData['ETH/EUR'].iloc[2:74],prcntdta['ethereum'].iloc[2:74]], axis=1)
mod = sm.tsa.VARMAX(dta,  order=(1,0), enforce_invertibility=True)
res = mod.fit(maxiter=5000, disp = False)
print(res.summary())
{% endhighlight %}{% endcapture %}
{% include notebook-cell.html execution_count="[10]:" content=content type='input' %}
<pre class="stream">
/Users/anaconda/lib/python3.5/site-packages/statsmodels/tsa/base/tsa_model.py:229: ValueWarning: A date index has been provided, but it has no associated frequency information and so will be ignored when e.g. forecasting.
' ignored when e.g. forecasting.', ValueWarning)
</pre>
<pre class="stream">
Statespace Model Results                             
===================================================================================
Dep. Variable:     ['ETH/EUR', 'ethereum']   No. Observations:                   72
Model:                              VAR(1)   Log Likelihood                -383.468
+ intercept   AIC                            784.936
Date:                     Fri, 13 Jan 2017   BIC                            805.426
Time:                             20:11:56   HQIC                           793.093
Sample:                                  0                                         
- 72                                         
Covariance Type:                       opg                                         
===================================================================================
Ljung-Box (Q):                34.06, 55.39   Jarque-Bera (JB):           6.45, 9.95
Prob(Q):                        0.73, 0.05   Prob(JB):                   0.04, 0.01
Heteroskedasticity (H):         2.31, 1.39   Skew:                       0.37, 0.71
Prob(H) (two-sided):            0.05, 0.43   Kurtosis:                   4.27, 4.14
Results for equation ETH/EUR                         
===============================================================================
coef    std err          z      P>|z|      [0.025      0.975]
-------------------------------------------------------------------------------
const           0.0007      0.224      0.003      0.997      -0.438       0.439
L1.ETH/EUR      0.9990      0.025     39.906      0.000       0.950       1.048
L1.ethereum  6.938e-05      0.003      0.021      0.983      -0.006       0.007
Results for equation ethereum                         
===============================================================================
coef    std err          z      P>|z|      [0.025      0.975]
-------------------------------------------------------------------------------
const          14.9369     25.095      0.595      0.552     -34.249      64.123
L1.ETH/EUR     -1.3223      2.982     -0.443      0.657      -7.167       4.522
L1.ethereum    -0.1611      0.130     -1.235      0.217      -0.417       0.095
Error covariance matrix                                   
=============================================================================================
coef    std err          z      P>|z|      [0.025      0.975]
---------------------------------------------------------------------------------------------
sqrt.var.ETH/EUR              0.4744      0.035     13.722      0.000       0.407       0.542
sqrt.cov.ETH/EUR.ethereum    -2.9960      3.934     -0.762      0.446     -10.706       4.714
sqrt.var.ethereum            24.3145      1.829     13.291      0.000      20.729      27.900
=============================================================================================

Warnings:
[1] Covariance matrix calculated using the outer product of gradients (complex-step).
</pre>

{% capture content %}{% highlight python %}
# Statespace
dta = pd.concat([AllData['ZEC/EUR'].iloc[2:74],prcntdta['zcash'].iloc[2:74]], axis=1)
mod = sm.tsa.VARMAX(dta,  order=(1,0), enforce_invertibility=True)
res = mod.fit(maxiter=5000, disp = False)
print(res.summary())
{% endhighlight %}{% endcapture %}
{% include notebook-cell.html execution_count="[11]:" content=content type='input' %}
<pre class="stream">
/Users/anaconda/lib/python3.5/site-packages/statsmodels/tsa/base/tsa_model.py:229: ValueWarning: A date index has been provided, but it has no associated frequency information and so will be ignored when e.g. forecasting.
' ignored when e.g. forecasting.', ValueWarning)
</pre>
<pre class="stream">
Statespace Model Results                            
================================================================================
Dep. Variable:     ['ZEC/EUR', 'zcash']   No. Observations:                   72
Model:                           VAR(1)   Log Likelihood                -769.140
+ intercept   AIC                           1556.281
Date:                  Fri, 13 Jan 2017   BIC                           1576.771
Time:                          20:11:57   HQIC                          1564.438
Sample:                               0                                         
- 72                                         
Covariance Type:                    opg                                         
===================================================================================
Ljung-Box (Q):                13.41, 47.17   Jarque-Bera (JB):        2299.67, 1.63
Prob(Q):                        1.00, 0.20   Prob(JB):                   0.00, 0.44
Heteroskedasticity (H):         0.01, 2.39   Skew:                       3.40, 0.23
Prob(H) (two-sided):            0.00, 0.04   Kurtosis:                  29.84, 2.42
Results for equation ZEC/EUR                         
==============================================================================
coef    std err          z      P>|z|      [0.025      0.975]
------------------------------------------------------------------------------
const          0.2972     31.490      0.009      0.992     -61.422      62.017
L1.ZEC/EUR     0.9482      0.039     24.121      0.000       0.871       1.025
L1.zcash      -0.3908      1.160     -0.337      0.736      -2.664       1.882
Results for equation zcash                          
==============================================================================
coef    std err          z      P>|z|      [0.025      0.975]
------------------------------------------------------------------------------
const          5.8637      3.803      1.542      0.123      -1.591      13.318
L1.ZEC/EUR    -0.0255      0.015     -1.667      0.095      -0.055       0.004
L1.zcash      -0.4231      0.120     -3.524      0.000      -0.658      -0.188
Error covariance matrix                                  
==========================================================================================
coef    std err          z      P>|z|      [0.025      0.975]
------------------------------------------------------------------------------------------
sqrt.var.ZEC/EUR          94.0766      5.038     18.674      0.000      84.203     103.951
sqrt.cov.ZEC/EUR.zcash    -4.1586     14.741     -0.282      0.778     -33.051      24.734
sqrt.var.zcash            26.6327      2.812      9.470      0.000      21.121      32.145
==========================================================================================

Warnings:
[1] Covariance matrix calculated using the outer product of gradients (complex-step).
</pre>

We see that the only significant google trends statistics growth rate is the one of bitcoin. This means we cannot conclude that google has predictive power in this case. But we have to state here that this is a very very simple application and we only observe data for the last 90 days, therefore this analysis is not really meangingful. Even if we have no meaningful results, this post shows how to use pytrends. Maybe it is the wrong branch to use google trend data and it would be more fruitful if we apply this procedure to a branch like tourism (because many people google where they want tp spend their holidays).

