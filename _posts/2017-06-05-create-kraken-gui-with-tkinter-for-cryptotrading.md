---
layout: post
title: The attempt to code a Kraken GUI with tkinter to trade Cryptocurrencies
tags: [python, economics, tkinter, cryptocurrency]
comments: true
description: This post will explain how to create a GUI for the Kraken Cryptocurrency Exchange with Tkinter and the Kraken API.
date:  2017-06-05 14:54:48
---
I was wondering why there are so few apps to trade cryptocurrencies at the kraken exchange. In fact I only know about one official app for iOS and one unofficial app for android (I'm not even sure whether you can place orders there), all other trades must be placed on the [kraken website](https://www.kraken.com) or via the [kraken API](https://www.kraken.com/help/api). Hence, why not coding a kraken GUI around the kraken API yourself? Lucky me, there is a tutorial on [pythonprogramming.net](https://pythonprogramming.net/tkinter-depth-tutorial-making-actual-program/), which explains how to use tkinter to make a trading application for Bitcoin. The basic ideas and the appearance are adopted from this tutorial. At the end we want to have a feature-rich app coded as simple as possible. The application will mainly:

* Fetch trades of several pairs and store them in an arctic database.
* Have multiple windows / navigation (tick data, historical data, market depth).
* Have live matplotlib graphs, displaying the price of various trading pairs.
* Add financial indicator like MACD, RSI, SMA and EMA to the graphs
* Allow the user to execute trades automatically.

I don't want to comment on the whole code step by step, I'd rather discuss the key prerequisites to run the code and explain the app by means of some pictures. At the end of this post you will find the app-code, hence you can go through it by yourself if you like. 

# What you need to run the app
Besides the standard python modules like matplotlib, tkinter, datetime or pandas you will also need to install the [mpl_finance](https://github.com/matplotlib/mpl_finance) module to plot the candlesticks, the [TA-Lib](https://github.com/mrjbq7/ta-lib) module to compute some technical financial indicators and the [krakenex](https://github.com/veox/python3-krakenex) module to connect to the kraken exchange via the API. Then you will also need to install the [arctic](https://github.com/manahl/arctic) module which uses mongodb to store the data. Install instructions and more can be found on their page. Before we can read from or write data to the database, which by the way is explained in the [last post](https://mxbu.github.io/logbook/2017/06/04/use-arctic-to-create-cryptocurrency-database/), mongodb must be started. This is done by the following command (For Mac OSX users, for others this could be different):

{% highlight python %}
import subprocess
if platform.system() == "Darwin":
subprocess.Popen(['/usr/local/bin/mongod', '--dbpath', '/users/'+os.getlogin()+'/MEGA/App/cryptodb', '--logpath', '/users/'+os.getlogin()+'/MEGA/App/cryptodb/krakendb.log', '--fork']) 
{% endhighlight %}

Let's now have a look at the app's start page:
<div class="popup-gallery">
<a href="/logbook/public/img/kraken-app/01.png" title=" Start Page"><img src="/logbook/public/img/kraken-app/01.png"></a>
</div>
There you have several possibilities. First, click "Update" to update the database to the latest available date, click "Skip" to continue with the data already contained in the database or click "Get Info" to look into the databse and get the latest import dates for each item therein. If you click on "Update" or "Skip" the command mentioned above will be executed and then you will be directed to the Graph Page:  
<div class="popup-gallery">
<a href="/logbook/public/img/kraken-app/02.png" title=" BTC/EUR data with volume"><img src="/logbook/public/img/kraken-app/02.png"></a>
</div>
In the menubar you have again several possibilities. You can change the pair, the time frame or the OHLC interval. Then you can add several technical financial indicators by clicking on Top or Main Indicator. This will open a popup window where you can specifiy the number of periods you want to consider. The following for example is for the MACD: 
<center>
<div class="popup-gallery">
<a href="/logbook/public/img/kraken-app/03.png" title="Popup Window to specify the MACD indicator"><img src="/logbook/public/img/kraken-app/03.png"></a>
</div>
</center>
This generates the following graph:
<div class="popup-gallery">
<a href="/logbook/public/img/kraken-app/04.png" title=" Candlestick chart with several indicators"><img src="/logbook/public/img/kraken-app/04.png"></a>
</div>
Another possibility is to have a look at the market depth:
<div class="popup-gallery">
<a href="/logbook/public/img/kraken-app/05.png" title="BTC/EUR market depth"><img src="/logbook/public/img/kraken-app/05.png"></a>
</div>
Or look at the tick data live graph: 
<div class="popup-gallery">
<a href="/logbook/public/img/kraken-app/06.png" title="Live graph of the lates few trades"><img src="/logbook/public/img/kraken-app/06.png"></a>
</div>

In the menubar you can click "Trading" which opens the options of a quick buy/sell or to begin automated trading. The quick buy/sell option is not live yet but this would be easy to implement. A simple automated trading strategy is implemented here but only for the XXBTZEUR pair and it's only to show the mechanism behind. It's a simple moving average strategy, which runs every hour, computes the moving averages and executes the appropriate commands. 

You now have some impressions what is possible to do with this app. The best, you go now through the code at the bottom of this post, if you are interested on how something is implemented. If you have some remarks or suggestions for improvement, you can write a comment below or the [gist on GitHub](https://gist.github.com/mxbu/a0b13ac7b8e09f7b8684d878c4dd646f). 




<link rel="stylesheet" href="/logbook/public/css/kraken-app/magnific-popup.css">
<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
<script src="/logbook/public/js/kraken-app/jquery.magnific-popup.min.js"></script>
<script src="/logbook/public/js/kraken-app/gallery.js"></script>




Here is the code for the app and also the file called `getkrkendata.py`, which contains some functions to help importing the data from the kraken API. These files can also be found on [GitHub](https://gist.github.com/mxbu/a0b13ac7b8e09f7b8684d878c4dd646f):

`kraken-app.py`:
{% highlight python %}
import matplotlib
matplotlib.use("TkAgg")
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg, NavigationToolbar2TkAgg
import matplotlib.animation as animation
from matplotlib import style
from matplotlib import pyplot as plt
import matplotlib.dates as mdates
import matplotlib.ticker as mticker
from mpl_finance import candlestick_ohlc

import datetime
import math
import threading

import tkinter as tk
from tkinter import ttk

import pandas as pd
import numpy as np
import platform
import os
if platform.system() == "Darwin":
    os.chdir('/users/'+os.getlogin()+'/MEGA/App')

import krakenex
import getkrakendata as gkd
import talib as tb
from arctic import Arctic
import subprocess
if platform.system() == "Darwin":
	subprocess.Popen(['/usr/local/bin/mongod', '--dbpath', '/users/'+os.getlogin()+'/MEGA/App/cryptodb', '--logpath', '/users/'+os.getlogin()+'/MEGA/App/cryptodb/krakendb.log', '--fork']) 

# Connect to Local MONGODB
krakendb = Arctic('localhost')

# Create the library - defaults to VersionStore
krakendb.initialize_library('Kraken')
# Access the library
kraken = krakendb['Kraken']

k = krakenex.API()
k.load_key('kraken.key')

LARGE_FONT= ("Verdana", 20)
NORM_FONT= ("Verdana", 10)
SMALL_FONT= ("Verdana", 8)

style.use("ggplot")

f = plt.figure()
a = f.add_subplot(111)

exchange = "Kraken"
programName = "kraken"
pairs = ['XETHZEUR','XXBTZEUR', 'XZECZEUR', 'XXRPZEUR']
pair = "XETHZEUR"
resampleSize = '1D'
DataPace = 30
candleWidth = 0.768
graph = None
tickdata_collection = {}
automatedTradingState = "stop"

topIndicator = "none"
bottomIndicator = "none"
middleIndicator = "none"
chartLoad = True

darkColor = "#183A54"
lightColor = "#00A3E0"

EMAs = []
SMAs = []

def loadChart(run):
    global chartLoad

    if run == "start":
        chartLoad = True

    elif run == "stop":
        chartLoad = False

def addMiddleIndicator(what):
    global middleIndicator
    global chartLoad
    if what != "none":
        if middleIndicator == "none":
            if what == "sma":
                midIQ = tk.Tk()
                midIQ.wm_title("Periods?")
                label = tk.Label(midIQ, text="Choose how many periods you want your SMA to be.")
                label.pack(side="top", fill="x", pady=10)
                e = tk.Entry(midIQ)
                e.insert(0,10)
                e.pack()
                e.focus_set()

                def callback():
                    global middleIndicator

                    middleIndicator = []
                    periods = (e.get())
                    group = []
                    group.append("sma")
                    group.append(int(periods))
                    middleIndicator.append(group)
                    print("middle indicator set to:",middleIndicator)
                    midIQ.destroy()
                    loadChart("start")

                b = tk.Button(midIQ, text="Submit", width=10, command=callback)
                b.pack()
                tk.mainloop()

            if what == "ema":
                midIQ = tk.Tk()
                #midIQ.wm_title("Periods?")
                label = tk.Label(midIQ, text="Choose how many periods you want your EMA to be.")
                label.pack(side="top", fill="x", pady=10)
                e = tk.Entry(midIQ)
                e.insert(0,10)
                e.pack()
                e.focus_set()

                def callback():
                    global middleIndicator

                    middleIndicator = []
                    periods = (e.get())
                    group = []
                    group.append("ema")
                    group.append(int(periods))
                    middleIndicator.append(group)
                    print("middle indicator set to:",middleIndicator)
                    midIQ.destroy()
                    loadChart("start")

                b = tk.Button(midIQ, text="Submit", width=10, command=callback)
                b.pack()
                tk.mainloop()
                
        else:
            if what == "sma":
                midIQ = tk.Tk()
                midIQ.wm_title("Periods?")
                label = tk.Label(midIQ, text="Choose how many periods you want your SMA to be.")
                label.pack(side="top", fill="x", pady=10)
                e = tk.Entry(midIQ)
                e.insert(0,10)
                e.pack()
                e.focus_set()

                def callback():
                    global middleIndicator

                    #middleIndicator = []
                    periods = (e.get())
                    group = []
                    group.append("sma")
                    group.append(int(periods))
                    middleIndicator.append(group)
                    print("middle indicator set to:",middleIndicator)
                    midIQ.destroy()
                    loadChart("start")

                b = tk.Button(midIQ, text="Submit", width=10, command=callback)
                b.pack()
                tk.mainloop()
                
            if what == "ema":
                midIQ = tk.Tk()
                midIQ.wm_title("Periods?")
                label = tk.Label(midIQ, text="Choose how many periods you want your EMA to be.")
                label.pack(side="top", fill="x", pady=10)
                e = tk.Entry(midIQ)
                e.insert(0,10)
                e.pack()
                e.focus_set()

                def callback():
                    global middleIndicator

                    #middleIndicator = []
                    periods = (e.get())
                    group = []
                    group.append("ema")
                    group.append(int(periods))
                    middleIndicator.append(group)
                    print("middle indicator set to:",middleIndicator)
                    midIQ.destroy()
                    loadChart("start")

                b = tk.Button(midIQ, text="Submit", width=10, command=callback)
                b.pack()
                tk.mainloop()
        
    else:
        middleIndicator = "none"
        loadChart("start")

def addTopIndicator(what):
    global topIndicator
    global chartLoad
    loadChart("start")

    if DataPace == "tick":
        popupmsg("Indicators in Tick Data not available.")

    elif what == "none":
        topIndicator = what

    elif what == "rsi":
        rsiQ = tk.Tk()
        rsiQ.wm_title("Periods?")
        label = tk.Label(rsiQ, text = "Choose how many periods you want each RSI calculation to consider.")
        label.pack(side="top", fill="x", pady=10)

        e = tk.Entry(rsiQ)
        e.insert(0,14)
        e.pack()
        e.focus_set()

        def callback():
            global topIndicator

            periods = (e.get())
            group = []
            group.append("rsi")
            group.append(periods)

            topIndicator = group
            print("Set top indicator to",group)
            rsiQ.destroy()
            loadChart("start")

        b = tk.Button(rsiQ, text="Submit", width=10, command=callback)
        b.pack()
        tk.mainloop()

    elif what == "macd":
        rsiQ = tk.Tk()
        rsiQ.wm_title("Periods?")
        
        label = tk.Label(rsiQ, text = "Choose how many periods you want each MA calculation to consider.")
        label.pack(side="top", fill="x", pady=10)
        
        frame1 = tk.Frame(rsiQ)
        frame1.pack(fill=tk.X)
        labelf = tk.Label(frame1, text = "Fastperiod:", width=10)
        labelf.pack(side=tk.LEFT, padx=5, pady=5)
        f = tk.Entry(frame1)
        f.insert(0,12)
        f.pack(fill=tk.X, padx=5, expand=True)
        f.focus_set()

        frame2 = tk.Frame(rsiQ)
        frame2.pack(fill=tk.X)        
        labels = tk.Label(frame2, text = "Slowperiod:", width=10)
        labels.pack(side=tk.LEFT, padx=5, pady=5)
        s = tk.Entry(frame2)
        s.insert(0,26)
        s.pack(fill=tk.X, padx=5, expand=True)
        s.focus_set()
        
        frame3 = tk.Frame(rsiQ)
        frame3.pack(fill=tk.X)
        labelsig = tk.Label(frame3, text = "Signalperiod:", width=10)
        labelsig.pack(side=tk.LEFT, padx=5, pady=5)
        sig = tk.Entry(frame3)
        sig.insert(0,9)
        sig.pack(fill=tk.X, padx=5, expand=True)
        sig.focus_set()

        def callback():
            global topIndicator

            fast = (f.get())
            slow = (s.get())
            signal = (sig.get())
            group = []
            group.append("macd")
            group.append(fast)
            group.append(slow)
            group.append(signal)

            topIndicator = group
            print("Set top indicator to",group)
            rsiQ.destroy()
            loadChart("start")

        b = tk.Button(rsiQ, text="Submit", width=10, command=callback)
        b.pack()
        tk.mainloop()

def changeGraph(toGraph):
    global graph
    graph = toGraph
    global chartLoad
    loadChart("start")    

def changeTimeFrame(tf):
    global DataPace
    global chartLoad
    loadChart("start")
    if tf == "7d" and resampleSize == "1Min":
        popupmsg("Too much data chosen, choose a smaller time frame or higher OHLC interval")
    else:
        DataPace = tf

def changePair(toPair):
    global pair
    pair = toPair
    global chartLoad
    loadChart("start") 

def changeSampleSize(size,width):
    global resampleSize
    global candleWidth
    global chartLoad
    loadChart("start")
    if DataPace == "7d" and resampleSize == "1Min":
        popupmsg("Too much data chosen, choose a smaller time frame or higher OHLC interval")

    elif DataPace == "tick":
        popupmsg("You're currently viewing tick data, not OHLC.")

    else:
        resampleSize = size
        candleWidth = width

def changeExchange(toWhat,pn):
    global exchange
    global programName
    global chartLoad
    loadChart("start")

    exchange = toWhat
    programName = pn
    
def popupmsg(msg):
    popup = tk.Tk()
    def leavemini():
       popup.destroy()
    popup.wm_title("!")
    label = ttk.Label(popup, text=msg, font=NORM_FONT)
    label.pack(side="top", fill="x", pady=10)
    B1 = ttk.Button(popup, text="Okay", command = popup.destroy)
    B1.pack()
    popup.mainloop()
    
def switchAutomatedTrading(what):
    global automatedTradingState
    if what == 'stop':
        t.cancel()
    automatedTradingState = what
    
def animate(i):
    def automatedTradingStrategy():
        pairs = ['XXBTZEUR']
        fastMA = {}
        slowMA = {}
        mask = {}
        tickdata_collection = {}
        for pair in pairs:
            actbalance, allbalance = gkd.get_kraken_balance(db = kraken)
            tickdata_collection[pair]=gkd.get_all_kraken_trades(pair, db = kraken)
            tickdata_collection[pair]=tickdata_collection[pair].price.resample('1H').ohlc().dropna().iloc[-241:-1,:]
            fastMA[pair] = tickdata_collection[pair].close.ewm(span=120).mean()
            slowMA[pair] = tickdata_collection[pair].close.ewm(span=240).mean()
            mask[pair] = fastMA[pair][-1]>slowMA[pair]
            if bool((actbalance.ZEUR.values >= 100) & (mask[pair][-1] == True)):
                txid, descr = gkd.add_kraken_order(pair, 'buy', 'market', math.floor(float(actbalance.ZEUR))/tickdata_collection[pair].close[-1])  
                print('New Order: ' +str(txid)+ '\nInfo: ')
                print(descr)
            elif bool((actbalance[pair[0:4]].values > 0) & (mask[pair][-1] == False)):
                txid, descr = gkd.add_kraken_order(pair, 'sell', 'market', int(actbalance[pair[0:4]].values) )
                print('New Order: ' +str(txid)+ '\nInfo: ')
                print(descr)
            else:
                print('Nothing new this hour!')
            global t            
            t = threading.Timer(3600, automatedTradingStrategy)
            t.start()
                                
    def computeMACD(OHLC, fastperiod, slowperiod, signalperiod ):
        MACD = tb.MACD(np.array(OHLC['close'].astype(float)), fastperiod,slowperiod,signalperiod)
        try:
                a0.plot(OHLC['MPLDate'], MACD[0], color=darkColor, lw=2, label = "MACD")
                a0.plot(OHLC['MPLDate'], MACD[1], color=lightColor, lw=1, label = "Signal")
                a0.fill_between(OHLC['MPLDate'], MACD[2], 0, alpha=0.5, facecolor=darkColor, edgecolor=darkColor)
                datLabel = "MACD"
                a0.legend(loc=2)
                a0.set_ylabel(datLabel)
        except Exception as e:
                print(str(e))
                global topIndicator
                topIndicator = "none"
                    
    def computeRSI(OHLC, period):
        RSI = tb.RSI(np.array(OHLC['close'].astype(float)), period)
        try:
                a0.plot(OHLC['MPLDate'], RSI, color=darkColor, lw=2)
                a0.axhline(y=20, color=lightColor, lw=1)
                a0.axhline(y=80, color=lightColor, lw=1)
                datLabel = "RSI"
                a0.set_ylabel(datLabel)
                a0.set_ylim([0,100])
        except Exception as e:
                print(str(e))
                global topIndicator
                topIndicator = "none"
        
    global automatedTradingState
    if automatedTradingState == 'start':
        automatedTradingStrategy()       
        automatedTradingState = 'stop'

    if chartLoad:
        if graph == "OHLCtick":
            if DataPace == "tick":
                try:
                    if exchange == 'Kraken':
                        a = plt.subplot2grid((6,4), (0,0), rowspan=5, colspan=4)
                        a2 = plt.subplot2grid((6,4), (5,0), rowspan=1, colspan=4, sharex = a)
                        
                        since = datetime.datetime.now()-datetime.timedelta(1)
                        since = since.timestamp()

                        data = gkd.get_kraken_trades(pair=pair)
                        data["datetime"] = np.array(data['datetime']).astype('datetime64[s]')
                        datestamps = data["datetime"].tolist()
                        volume = data["volume"].apply(float).tolist()

                        buys = data[(data['buy/sell']=='b')]
                        buyDates = (buys["datetime"]).tolist()
                      
                        sells = data[(data['buy/sell']=='s')]
                        sellDates = (sells["datetime"]).tolist()

                        a.clear()   
                        if middleIndicator != "none": 
                            for eachMA in middleIndicator:
                                ewma = pd.stats.moments.ewma
                                
                                if eachMA[0] == "sma":
                                    #sma = pd.rolling_mean(OHLC["close"],eachMA[1])
                                    sma=data['price'].rolling(window=eachMA[1]).mean()
                                    label = str(eachMA[1])+" SMA"
                                    a.plot(data['datetime'],sma, label=label)
                                if eachMA[0] == "ema":
                                    #ewma = pd.stats.moments.ewma
                                    ewma = data['price'].ewm(span=eachMA[1]).mean()
                                    label = str(eachMA[1])+" EMA"
                                    a.plot(data['datetime'],ewma, label=label)

                            a.legend(loc=0)

                        a.set_ylabel("Price") 
                        a.plot_date(buyDates,buys["price"], lightColor, label ="buys")

                        a.plot_date(sellDates,sells["price"], darkColor, label = "sells")

                        a2.set_ylabel("Volume") 
                        a2.fill_between(datestamps,0, volume, facecolor='#183A54')

                        a.xaxis.set_major_locator(mticker.MaxNLocator(5))
                        a.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d %H:%M'))
                        plt.setp(a.get_xticklabels(), visible=False)
                        
                        a.legend(bbox_to_anchor=(0., 1.02, 1., .102), loc=3,
                                 ncol=2, borderaxespad=0.)
                        
                        title = pair+' Tick Data\nLast Price: '+str(data["price"].iloc[-1])
                        a.set_title(title)
                        
                except Exception as e:
                    print("failed",str(e))

##### ALL OTHER, NON-TICK, DATA. ##################################
            else:
                try:
                        if topIndicator != "none" and bottomIndicator != "none":
                                # Main Graph
                                a = plt.subplot2grid((6,4), (1,0), rowspan = 3, colspan = 4)

                                # Volume
                                a2 = plt.subplot2grid((6,4), (4,0), sharex = a, rowspan = 1, colspan = 4)

                                # Bottom Indicator
                                a3 = plt.subplot2grid((6,4), (5,0), sharex = a, rowspan = 1, colspan = 4)

                                # Top Indicator
                                a0 = plt.subplot2grid((6,4), (0,0), sharex = a, rowspan = 1, colspan = 4)

                        elif topIndicator != "none":
                                # Main Graph
                                a = plt.subplot2grid((6,4), (1,0), rowspan = 4, colspan = 4)

                                # Volume
                                a2 = plt.subplot2grid((6,4), (5,0), sharex = a, rowspan = 1, colspan = 4)

                                # Top Indicator
                                a0 = plt.subplot2grid((6,4), (0,0), sharex = a, rowspan = 1, colspan = 4)

                        elif bottomIndicator != "none":

                                # Main Graph
                                a = plt.subplot2grid((6,4), (0,0), rowspan = 4, colspan = 4)

                                # Volume
                                a2 = plt.subplot2grid((6,4), (4,0), sharex = a, rowspan = 1, colspan = 4)

                                # Bottom Indicator
                                a3 = plt.subplot2grid((6,4), (5,0), sharex = a, rowspan = 1, colspan = 4)

                        else:
                                # Main Graph
                                a = plt.subplot2grid((6,4), (0,0), rowspan = 5, colspan = 4)

                                # Volume
                                a2 = plt.subplot2grid((6,4), (5,0), sharex = a, rowspan = 1, colspan = 4)
                                                       
                        if DataPace == "all":
                                start = None
                                stop = None
                        else:
                            stop = datetime.datetime.now()
                            start = stop-datetime.timedelta(days=DataPace)
                            mask = (tickdata_collection[pair].index > start) & (tickdata_collection[pair].index <= datetime.datetime.now())
                            data = tickdata_collection[pair].loc[mask]
                                               
                        ohlc = data.price.resample(resampleSize).ohlc().dropna().iloc[1:,:]
                        volume = data.volume.resample(resampleSize).sum().dropna().iloc[1:]
   
                        dateStamp = np.array(ohlc.index).astype('datetime64[s]')
                        dateStamp = dateStamp.tolist()
 
                        df = pd.DataFrame({'Datetime':dateStamp})
                        df['MPLDate'] = df['Datetime'].apply(lambda date: mdates.date2num(date.to_pydatetime()))
                        df.index=dateStamp
                        ohlc.insert(0,'MPLDate', df.MPLDate)

                        a.clear()
                        if middleIndicator != "none": 
                            for eachMA in middleIndicator:
                                ewma = pd.stats.moments.ewma
                                
                                if eachMA[0] == "sma":
                                    #sma = pd.rolling_mean(OHLC["close"],eachMA[1])
                                    sma=ohlc['close'].rolling(window=eachMA[1]).mean()
                                    label = str(eachMA[1])+" SMA"
                                    a.plot(ohlc['MPLDate'],sma, label=label)
                                if eachMA[0] == "ema":
                                    #ewma = pd.stats.moments.ewma
                                    ewma = ohlc['close'].ewm(com=eachMA[1]).mean()
                                    label = str(eachMA[1])+" EMA"
                                    a.plot(ohlc['MPLDate'],ewma, label=label)

                            a.legend(loc=0)

                        if topIndicator[0] == "rsi":
                            try:
                                computeRSI(ohlc,int(topIndicator[1]))
                            except:
                                print("failed rsi")
                        elif topIndicator[0] == "macd":
                            try:
                                computeMACD(ohlc,int(topIndicator[1]),int(topIndicator[2]),int(topIndicator[3]))
                            except:
                                print("failed macd")
                        
                        candlesticks = candlestick_ohlc(a, ohlc[['MPLDate', 'open', 'high', 'low', 'close']].astype(float).values, width=candleWidth, colorup=lightColor, colordown=darkColor)
                        a.set_ylabel("Price") 
                      
                        a.xaxis.set_major_locator(mticker.MaxNLocator(3))
                        a.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d %H:%M'))
                        
                        a2.set_ylabel("Volume") 
                        a2.fill_between(ohlc.MPLDate,0, volume.astype(float), facecolor='#183A54')

                        plt.setp(a.get_xticklabels(), visible=False)
                        if topIndicator != "none":  
                            plt.setp(a0.get_xticklabels(), visible=False)

                        if bottomIndicator != "none":  
                            plt.setp(a2.get_xticklabels(), visible=False)
 
                        last = str(gkd.get_kraken_ticker(pair)['c'][0])
 
                        if DataPace == 1:
                            title = pair+' 1 Day Data with '+str(resampleSize)+' Bars\nLast Price: '+last
                        if DataPace == 3:
                            title = pair+' 3 Day Data with '+str(resampleSize)+' Bars\nLast Price: '+last
                        if DataPace == 7:
                            title = pair+' 7 Day Data with '+str(resampleSize)+' Bars\nLast Price: '+last
                        if DataPace == 30:
                            title = pair+' 1 Month Data with '+str(resampleSize)+' Bars\nLast Price: '+last
                        if DataPace == 180:
                            title = pair+' 6 Month Data with '+str(resampleSize)+' Bars\nLast Price: '+last
                        if DataPace == 365:
                            title = pair+' 1 Year Data with '+str(resampleSize)+' Bars\nLast Price: '+last
                        if DataPace == "all":
                            title = pair+' All available Data with '+str(resampleSize)+' Bars\nLast Price: '+last

                        if topIndicator != "none":  
                            a0.set_title(title)
                        else:
                            a.set_title(title)
                        print('NewGraph!')
                        loadChart("stop")
           
                except Exception as e:
                        print(str(e),"main animate non tick")
    
        elif graph == "depth":
            if exchange == "Kraken":
                        a = plt.subplot2grid((6,4), (0,0), rowspan=5, colspan=4)
                        a2 = plt.subplot2grid((6,4), (5,0), rowspan=1, colspan=4, sharex = a)
                        
                        data = gkd.get_kraken_depth(pair = pair, count='1000')
                        asks = data[0]
                        bids = data[1]
                        bids = bids.sort_values(by='price')
                        bids = bids.iloc[::-1]
                        cumsumasks = asks['volume'].astype(float).cumsum()
                        cumsumbids = bids['volume'].astype(float).cumsum()
                        last = float(gkd.get_kraken_ticker(pair)['c'][0])
                        
                        a.clear()
                        a.set_ylabel("Cumulative Volume") 

                        a.fill_between(asks['price'].astype(float),0,cumsumasks.astype(float), facecolor = lightColor , label ="asks")
                        a.fill_between(bids['price'].astype(float),0,cumsumbids.astype(float), facecolor = darkColor, label ="bids")
                        a.axvline(last, color='k', linestyle='--')

                        a2.set_ylabel("Volume") 
                        a2.fill_between(asks['price'].astype(float),0, asks['volume'].astype(float), facecolor='#183A54')
                        a2.fill_between(bids['price'].astype(float),0, bids['volume'].astype(float), facecolor='#183A54')

                        plt.setp(a.get_xticklabels(), visible=False)
                        
                        a.legend(bbox_to_anchor=(0., 1.02, 1., .102), loc=3,
                                 ncol=2, borderaxespad=0.)
                        
                        title = pair+' Depth\nLastPrice: '+str(last)
                        a.set_title(title)
                      
        loadChart("stop")
                      
class CryptoApp(tk.Tk):

    def __init__(self, *args, **kwargs):
        
        tk.Tk.__init__(self, *args, **kwargs)        
        
        tk.Tk.wm_title(self, "Dashboard - Prices")
                
        container = tk.Frame(self)
        container.pack(side="top", fill="both", expand = True)
        container.grid_rowconfigure(0, weight=1)
        container.grid_columnconfigure(1, weight=1)

        menubar = tk.Menu(container)
        filemenu = tk.Menu(menubar, tearoff=0)
        filemenu.add_command(label="Go to Start Page", command = lambda: self.show_frame(StartPage))
        filemenu.add_separator()
        filemenu.add_command(label="Exit", command=quit)
        menubar.add_cascade(label="File", menu=filemenu)
        
        graphChoice = tk.Menu(menubar, tearoff=1)
        graphChoice.add_command(label="OHLC / Tick",
                                   command=lambda: changeGraph("OHLCtick"))
        graphChoice.add_command(label="Market Depth",
                                   command=lambda: changeGraph("depth"))

        menubar.add_cascade(label="Graph", menu=graphChoice)
        
        pairChoice = tk.Menu(menubar, tearoff=1)
        pairChoice.add_command(label="ETH/EUR",
                                   command=lambda: changePair("XETHZEUR"))
        pairChoice.add_command(label="BTC/EUR",
                                   command=lambda: changePair("XXBTZEUR"))
        pairChoice.add_command(label="ZEC/EUR",
                                   command=lambda: changePair("XZECZEUR"))
        pairChoice.add_command(label="XRP/EUR",
                                   command=lambda: changePair("XXRPZEUR"))

        menubar.add_cascade(label="Pair", menu=pairChoice)

        dataTF = tk.Menu(menubar, tearoff=1)
        dataTF.add_command(label = "Tick",
                           command=lambda: changeTimeFrame('tick'))
        dataTF.add_command(label = "1 Day",
                           command=lambda: changeTimeFrame(1))
        dataTF.add_command(label = "1 Week",
                           command=lambda: changeTimeFrame(7))
        dataTF.add_command(label = "1 Month",
                           command=lambda: changeTimeFrame(30))
        dataTF.add_command(label = "6 Months",
                           command=lambda: changeTimeFrame(180))
        dataTF.add_command(label = "1 Year",
                           command=lambda: changeTimeFrame(365))
        dataTF.add_command(label = "All Available",
                           command=lambda: changeTimeFrame('all'))
        menubar.add_cascade(label = "Data Time Frame", menu = dataTF)

        OHLCI = tk.Menu(menubar, tearoff=1)
        OHLCI.add_command(label = "Tick",
                           command=lambda: changeTimeFrame('tick'))
        OHLCI.add_command(label = "1 minute",
                           command=lambda: changeSampleSize('1Min', 0.0005))
        OHLCI.add_command(label = "5 minute",
                           command=lambda: changeSampleSize('5Min', 0.003))
        OHLCI.add_command(label = "15 minute",
                           command=lambda: changeSampleSize('15Min', 0.008))
        OHLCI.add_command(label = "30 minute",
                           command=lambda: changeSampleSize('30Min', 0.016))
        OHLCI.add_command(label = "1 Hour",
                           command=lambda: changeSampleSize('1H', 0.032))
        OHLCI.add_command(label = "4 Hour",
                           command=lambda: changeSampleSize('4H', 0.126))
        OHLCI.add_command(label = "24 Hour",
                           command=lambda: changeSampleSize('1D', 0.768))
        OHLCI.add_command(label = "1 Week",
                           command=lambda: changeSampleSize('1W', 5))
        OHLCI.add_command(label = "2 Weeks",
                           command=lambda: changeSampleSize('2W', 11))

        menubar.add_cascade(label="OHLC Interval", menu=OHLCI)

        topIndi = tk.Menu(menubar, tearoff=1)
        topIndi.add_command(label="None",
                            command = lambda: addTopIndicator('none'))
        topIndi.add_command(label="RSI",
                            command = lambda: addTopIndicator('rsi'))
        topIndi.add_command(label="MACD",
                            command = lambda: addTopIndicator('macd'))

        menubar.add_cascade(label="Top Indicator", menu=topIndi)

        mainI = tk.Menu(menubar, tearoff=1)
        mainI.add_command(label="None",
                            command = lambda: addMiddleIndicator('none'))
        mainI.add_command(label="SMA",
                            command = lambda: addMiddleIndicator('sma'))
        mainI.add_command(label="EMA",
                            command = lambda: addMiddleIndicator('ema'))

        menubar.add_cascade(label="Main Indicator", menu=mainI)

        tradeButton = tk.Menu(menubar, tearoff=1)
        tradeButton.add_command(label = "Begin Automated Trading",
                                command=lambda: switchAutomatedTrading("start"))
        tradeButton.add_command(label = "Stop Automated Trading",
                                command=lambda: switchAutomatedTrading("stop"))

        tradeButton.add_separator()
        tradeButton.add_command(label = "Quick Buy",
                                command=lambda: popupmsg("This is not live yet"))
        tradeButton.add_command(label = "Quick Sell",
                                command=lambda: popupmsg("This is not live yet"))

        tradeButton.add_separator()
        tradeButton.add_command(label = "Set-up Quick Buy/Sell",
                                command=lambda: popupmsg("This is not live yet"))

        menubar.add_cascade(label="Trading", menu=tradeButton)

        startStop = tk.Menu(menubar, tearoff = 1)
        startStop.add_command( label="Resume",
                               command = lambda: loadChart('start'))
        startStop.add_command( label="Pause",
                               command = lambda: loadChart('stop'))
        menubar.add_cascade(label = "Client", menu = startStop)

        helpmenu = tk.Menu(menubar, tearoff=0)

        menubar.add_cascade(label="Help", menu=helpmenu)

        tk.Tk.config(self, menu=menubar)

        self.frames = {}

        for F in (StartPage, GraphPage):

            frame = F(container, self)

            self.frames[F] = frame

            frame.grid(row=0, column=0, columnspan = 2,sticky="nsew")
       
        self.show_frame(StartPage)

    def show_frame(self, cont):
        global chartLoad
        loadChart("start")
        frame = self.frames[cont]
        frame.tkraise()
       
class StartPage(tk.Frame):

    def __init__(self, parent, controller):
        tk.Frame.__init__(self,parent)
        label = tk.Label(self, text=("""\nKraken Trading application use at your own risk. There is no promise of warranty.\n"""), font=LARGE_FONT)
        label.pack()
                
        texframe = tk.Frame(self,parent)
        texframe.pack()
        scrollbar = tk.Scrollbar(texframe)
        scrollbar.pack(side = tk.RIGHT,fill='y')
        tex = tk.Text(texframe, relief=tk.SUNKEN, borderwidth=1,yscrollcommand=scrollbar.set)
        tex.pack(expand = True, side = tk.TOP)
        
        s = 'What would you like to do?\n Click "Update" to update all the data (this could take some time, depending on the amount of data ), \n"Skip" to do it later, \n"Get Info" to see the latest imports or \n"Exit" if you want to quit.\n'			
        tex.insert(tk.END, s)
        tex.see(tk.END)
        
        scrollbar.config( command = tex.yview )
        
        buttonframe = tk.Frame(self,parent)
        buttonframe.pack()
        button1 = tk.Button(buttonframe, text="Update",
                             command=lambda: updateTickData(pairs,tex,db=kraken))
        button1.pack( side = 'left', padx=10, pady = 5)

        button2 = tk.Button(buttonframe, text="Skip",
                            command=lambda: skip(pairs, kraken))
        button2.pack( side = 'left',padx=10, pady = 5) 
        
        button3 = tk.Button(buttonframe, text="Get Info",
                            command=lambda: getInfo( tex, db = kraken))
        button3.pack( side = 'left',padx=10, pady = 5) 

        button4 = tk.Button(buttonframe, text="Exit",
                            command=quit)
        button4.pack( side = 'left',padx=10, pady = 5)
    
        def updateTickData(pairs, tex, db):
            s = '\n Begin import of '+', '.join(pairs[0:len(pairs)-1])+' and '+pairs[-1]+'\n This could take some time! \n'			
            tex.insert(tk.END, s)
            tex.see(tk.END)

            for pair in pairs:
                tickdata_collection[pair]=gkd.get_all_kraken_trades(pair, db = kraken)
            s = '\nAll Pairs are up do date now!\n'			
            tex.insert(tk.END, s)
            tex.see(tk.END)
                
        def getInfo(tex, db):
            infolist = kraken.list_versions()
            s = '\n Last updates: \n'
            tex.insert(tk.END, s)
            tex.see(tk.END)
            for list in infolist:
                s = list['symbol']+' updated at ' + list['date'].strftime('%Y-%m-%d %H:%M:%S')+ ', Version: '+ str(list['version'])+'\n'
                tex.insert(tk.END, s)
                tex.see(tk.END)
            snapshots =  kraken.list_snapshots()
            s = '\n Last snapshots: \n'
            tex.insert(tk.END, s)
            tex.see(tk.END)
            for list in snapshots:
                s = list+'\n'
                tex.insert(tk.END, s)
                tex.see(tk.END)
                
        def skip(pairs, db):
            if bool(tickdata_collection):
                    print('Already imported newest data')
            else:
                for pair in pairs:
                    tickdata_collection[pair] = kraken.read(pair).data
                    print('Latest available data of '+pair+' imported ') 
            global graph
            graph = "OHLCtick"
            controller.show_frame(GraphPage)

class GraphPage(tk.Frame):

    def __init__(self, parent, controller):
        tk.Frame.__init__(self, parent)

        canvas = FigureCanvasTkAgg(f, self)
        canvas.show()
        canvas.get_tk_widget().pack(side=tk.BOTTOM, fill=tk.BOTH, expand=True)

        toolbar = NavigationToolbar2TkAgg(canvas, self)
        toolbar.update()
        canvas._tkcanvas.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

app = CryptoApp()
app.geometry("1280x720")
ani = animation.FuncAnimation(f, animate, interval=2000)
app.mainloop()
{% endhighlight %}

`getkrakendata.py`:

{% highlight python %}
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Fri Apr 14 13:08:38 2017

@author: mxbu
"""
import urllib
import json
import time
import pandas as pd
import datetime
import krakenex

k = krakenex.API()
k.load_key('kraken.key')

def get_kraken_ohlc(interval,pair=None,since=None):
    '''
    Output:
        <time>, <open>, <high>, <low>, <close>, <vwap>, <volume>, <count>   
    
    Input: 
        interval = time frame interval in minutes: 
                    1 , 5, 15, 30, 60, 240, 1440, 10080, 21600
    '''
    if pair is None:
        pair = 'XETHZEUR'

    data = urllib.request.urlopen("https://api.kraken.com/0/public/OHLC?pair="+pair+"&interval="+str(interval)+"&since="+str(since)).read()
    data = data.decode()
    data = json.loads(data)
    data = data['result'][pair]

    newdf = pd.DataFrame(data)
    dates = [datetime.datetime.fromtimestamp(ts) for ts in newdf.iloc[:,0].values]
    datestring = [dates[tt].strftime('%Y-%m-%d %H:%M:%S') for tt in range(len(newdf))]
    datdf = pd.DataFrame(datestring)
    enddf = pd.concat([newdf,datdf], axis =1 )
    enddf.columns = ['time', 'open', 'high', 'low', 'close', 'vwap', 'volume', 'count', 'datetime']
    return enddf


def get_kraken_ticker(pair=None):
    '''
    Input: 
        <pair> = pair name
        
    Output:
        Dictionary:
        a = ask array(<price>, <whole lot volume>, <lot volume>),
        b = bid array(<price>, <whole lot volume>, <lot volume>),
        c = last trade closed array(<price>, <lot volume>),
        d = unix time stamp
        v = volume array(<today>, <last 24 hours>),
        p = volume weighted average price array(<today>, <last 24 hours>),
        t = number of trades array(<today>, <last 24 hours>),
        l = low array(<today>, <last 24 hours>),
        h = high array(<today>, <last 24 hours>),
        o = today's opening price
    '''
    if pair is None:
        pair = 'XETHZEUR'
        
    data = urllib.request.urlopen("https://api.kraken.com/0/public/Ticker?pair="+pair).read()
    data = data.decode()
    data = json.loads(data)
    data = data['result'][pair]
    
    date = urllib.request.urlopen('https://api.kraken.com/0/public/Time').read()
    date = date.decode()
    date = json.loads(date)
    date = date['result']['unixtime']
    
    data['d'] = date
    return data

def get_kraken_trades(pair=None, since = None):
    '''
    Input: 
        pair = pair name
        since = unix datestamp
    Output:
        
    '''
    if pair is None:
        pair = 'XETHZEUR'
        
    data = urllib.request.urlopen("https://api.kraken.com/0/public/Trades?pair="+pair+"&since="+str(since)).read()
    data = data.decode()
    data = json.loads(data)
    data = data['result'][pair]
    
    newdf = pd.DataFrame(data)
    dates = [datetime.datetime.fromtimestamp(ts) for ts in newdf.iloc[:,2].values]
    datestring = [dates[tt].strftime('%Y-%m-%d %H:%M:%S') for tt in range(len(newdf))]
    datdf = pd.DataFrame(datestring)
    enddf = pd.concat([newdf,datdf], axis =1 )
    enddf.columns = ['price', 'volume', 'time', 'buy/sell', 'market/limit', 'misc', 'datetime']
    return enddf

def get_kraken_spread(pair=None, since = None):
    '''
    Input: 
        pair = pair name
        since = 
    Output:
        
    '''
    if pair is None:
        pair = 'XETHZEUR'
        
    data = urllib.request.urlopen("https://api.kraken.com/0/public/Spread?pair="+pair+"&since="+str(since)).read()
    data = data.decode()
    data = json.loads(data)
    data = data['result'][pair]
    
    newdf = pd.DataFrame(data)
    dates = [datetime.datetime.fromtimestamp(ts) for ts in newdf.iloc[:,0].values]
    datestring = [dates[tt].strftime('%Y-%m-%d %H:%M:%S') for tt in range(len(newdf))]
    datdf = pd.DataFrame(datestring)
    enddf = pd.concat([newdf,datdf], axis =1 )
    enddf.columns = ['time', 'bid', 'ask', 'datetime']
    return enddf

def get_kraken_depth(pair=None, count = None):
    '''
    Input: 
        pair = pair name
        since = 
    Output:
        
    '''
    if pair is None:
        pair = 'XETHZEUR'
        
    data = urllib.request.urlopen("https://api.kraken.com/0/public/Depth?pair="+pair+"&count="+str(count)).read()
    data = data.decode()
    data = json.loads(data)
    data = data['result'][pair]
    asks = pd.DataFrame(data['asks'])
    dates = [datetime.datetime.fromtimestamp(ts) for ts in asks.iloc[:,2].values]
    datestring = [dates[tt].strftime('%Y-%m-%d %H:%M:%S') for tt in range(len(asks))]
    datdf = pd.DataFrame(datestring)
    asks = pd.concat([asks,datdf], axis =1 )
    asks.columns = ['price', 'volume', 'time', 'datetime']
    
    bids = pd.DataFrame(data['bids'])
    dates = [datetime.datetime.fromtimestamp(ts) for ts in bids.iloc[:,2].values]
    datestring = [dates[tt].strftime('%Y-%m-%d %H:%M:%S') for tt in range(len(bids))]
    datdf = pd.DataFrame(datestring)
    bids = pd.concat([bids,datdf], axis =1 )
    bids.columns = ['price', 'volume', 'time', 'datetime']
    return asks, bids
    
def get_all_kraken_trades(pair, since = None, db = None):
    """
    Input: 
        pair = pair name
        since = unix datestamp
    Output:
        Pandas DataFrame
    """
    history = pd.DataFrame( columns = ['price', 'volume', 'time', 'buy/sell', 'market/limit'])
    if pair in db.list_symbols():
        since = db.read(pair).metadata['last']     
    elif since == None:
        since = 0 
    try:
        while True:    
            data = urllib.request.urlopen("https://api.kraken.com/0/public/Trades?pair="+pair+"&since="+str(since)).read()
            data = data.decode()
            data = json.loads(data)
            last = int(data['result']['last'])
            data = data['result'][pair]
            data = pd.DataFrame(data)
            if data.empty:
                break
            dates = [datetime.datetime.fromtimestamp(ts) for ts in (data[2].values)]
            data.index = pd.DatetimeIndex(dates)
            data = data.iloc[:,0:5]
            data.iloc[:,0:3] = data.iloc[:,0:3].astype(float)
            data.columns = ['price', 'volume', 'time', 'buy/sell', 'market/limit']
            history = history.append(data) #ignore_index=True) 
            since = last
            print('last imported: '+history.index[-1].strftime('%Y-%m-%d %H:%M:%S'))
            time.sleep(2)
    except Exception as e:
            print(str(e))
    db.append(pair, history, metadata={'last': last, 'source': 'Kraken'})
    time.sleep(2)
    alltrades = db.read(pair).data
    return alltrades

def add_kraken_order(pair, buysell, ordertype, volume, **kwargs  ):
    '''
    Input:
        pair = asset pair
        buysell = type of order (buy/sell)
        ordertype = order type:
            market
            limit (price = limit price)
            stop-loss (price = stop loss price)
            take-profit (price = take profit price)
            stop-loss-profit (price = stop loss price, price2 = take profit price)
            stop-loss-profit-limit (price = stop loss price, price2 = take profit price)
            stop-loss-limit (price = stop loss trigger price, price2 = triggered limit price)
            take-profit-limit (price = take profit trigger price, price2 = triggered limit price)
            trailing-stop (price = trailing stop offset)
            trailing-stop-limit (price = trailing stop offset, price2 = triggered limit offset)
            stop-loss-and-limit (price = stop loss price, price2 = limit price)
            settle-position
        price = price (optional.  dependent upon ordertype)
        price2 = secondary price (optional.  dependent upon ordertype)
        volume = order volume in lots
        leverage = amount of leverage desired (optional.  default = none)
        oflags = comma delimited list of order flags (optional):
            viqc = volume in quote currency (not available for leveraged orders)
            fcib = prefer fee in base currency
            fciq = prefer fee in quote currency
            nompp = no market price protection
            post = post only order (available when ordertype = limit)
        starttm = scheduled start time (optional):
            0 = now (default)
            +<n> = schedule start time <n> seconds from now
            <n> = unix timestamp of start time
        expiretm = expiration time (optional):
            0 = no expiration (default)
            +<n> = expire <n> seconds from now
            <n> = unix timestamp of expiration time
        userref = user reference id.  32-bit signed number.  (optional)
        validate = validate inputs only.  do not submit order (optional)

        optional closing order to add to system when order gets filled:
            close[ordertype] = order type
            close[price] = price
            close[price2] = secondary price
                        
    Output:
        descr = order description info
            order = order description
            close = conditional close order description (if conditional close set)
        txid = array of transaction ids for order (if order was added successfully)
    '''       
    orderinfo = k.query_private('AddOrder', {'pair': pair,'type' : buysell, 
                                 'ordertype' : ordertype, 'volume' : volume,
                                  **kwargs   })
    if bool(orderinfo['error']):
        raise Exception(orderinfo['error'])
    return orderinfo['result']['txid'], orderinfo['result']['descr']
    
def get_kraken_balance(db = None):
    balance = k.query_private('Balance')['result']
    df = pd.DataFrame(list(balance.items()))
    df = df.transpose()
    df.columns = df.iloc[0]
    df = df.reindex(df.index.drop(0))
    df = df.astype(float)
    last = datetime.datetime.now()
    df.index = pd.DatetimeIndex([last])
    if db:
        db.append('Balance', df, metadata={'last': last, 'source': 'Kraken'})
        allbalance = db.read('Balance').data
        return df, allbalance
    else:
        return df

def cancel_kraken_order(txid):
    k.query_private('CancelOrder', {'txid': txid})
{% endhighlight %}
