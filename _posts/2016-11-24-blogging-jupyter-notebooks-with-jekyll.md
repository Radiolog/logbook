---
layout: post
title: Blogging Jupyter Notebooks with Jekyll
tags: [python, jupyter, jekyll]
comments: true
date:  2016-11-25 14:25:38
description: This post shows how to convert a jupyter notebook to a jekyll blog post.
---
While writing the [last blog post](https://mxbu.github.io/logbook/2016/11/19/optimization/), i was wondering wether it's possible to convert a whole jupyter notebook to a jekyll blog post. So, I googled and found a good post on [this blog](http://briancaffey.github.io/2016/03/14/ipynb-with-jekyll.html), which suggests to use the command `nbconvert` to convert the notebook to a markdown file . It's a very easy and convenient way, although there are some issues which let me digging deeper into this topic and finally were the reason for me not to choose this way to convert my notebooks. But later more on that.

If you have the following jupyter notebook called [`nbexample.ipynb`](https://github.com/mxbu/logbook/blob/gh-pages/blog-notebooks/nbexample.ipynb) and want to convert it, you only need to run the command


```
$ jupyter nbconvert nbexample.ipynb --to markdown
```

in your terminal and that's it. Your terminal should now say something like:


```    
 $ jupyter nbconvert nbexample.ipynb --to markdown
[NbConvertApp] Converting notebook nbexample.ipynb to markdown
[NbConvertApp] Support files will be in nbexample_files/
[NbConvertApp] Making directory nbexample_files
[NbConvertApp] Writing 2094 bytes to nbexample.md
```

This creates a `.md` file and puts images and related files into the created folder `nbexample_files/`. The last thing to do is to put the markdown file into your `_posts` folder of your blog and to make sure that the paths (e.g. of images) are correct.

### Result of `nbconvert`
The following is the outcome of the procedure described above:


```python
from pylab import *
import numpy as np
import pandas as pd
```


```python
x = np.linspace(0, 5, 10)
xx = np.linspace(-0.75, 1., 100)
n = np.array([0,1,2,3,4,5])
dates = pd.date_range('20130101', periods=6)
df = pd.DataFrame(np.random.randn(6,4), index=dates, columns=list('ABCD'))
df
```




<div style="overflow-x: auto;-webkit-overflow-scrolling: touch;">
<table border="1" class="dataframe">
<thead>
<tr style="text-align: right;">
<th></th>
<th>A</th>
<th>B</th>
<th>C</th>
<th>D</th>
</tr>
</thead>
<tbody>
<tr>
<th>2013-01-01</th>
<td>2.278744</td>
<td>-0.652785</td>
<td>0.574983</td>
<td>-0.408235</td>
</tr>
<tr>
<th>2013-01-02</th>
<td>0.886904</td>
<td>-1.415350</td>
<td>0.487806</td>
<td>-0.117535</td>
</tr>
<tr>
<th>2013-01-03</th>
<td>1.280152</td>
<td>0.451589</td>
<td>2.450064</td>
<td>-0.159981</td>
</tr>
<tr>
<th>2013-01-04</th>
<td>-0.163132</td>
<td>0.141542</td>
<td>1.810313</td>
<td>2.263799</td>
</tr>
<tr>
<th>2013-01-05</th>
<td>-0.488827</td>
<td>0.263963</td>
<td>0.598489</td>
<td>0.933941</td>
</tr>
<tr>
<th>2013-01-06</th>
<td>-1.589058</td>
<td>0.054630</td>
<td>1.425882</td>
<td>0.133386</td>
</tr>
</tbody>
</table>
</div>




```python
fig, axes = plt.subplots(1, 4, figsize=(12,3))

axes[0].scatter(xx, xx + 0.25*np.random.randn(len(xx)))
axes[0].set_title("scatter")

axes[1].step(n, n**2, lw=2)
axes[1].set_title("step")

axes[2].bar(n, n**2, align="center", width=0.5, alpha=0.5)
axes[2].set_title("bar")

axes[3].fill_between(x, x**2, x**3, color="green", alpha=0.5);
axes[3].set_title("fill_between");
show(fig)
```

![png](/logbook/public/img/nbexample/image1.png)


```python
# polar plot using add_axes and polar projection
fig = plt.figure()
ax = fig.add_axes([0.0, 0.0, .6, .6], polar=True)
t = np.linspace(0, 2 * np.pi, 100)
ax.plot(t, t, color='blue', lw=3);
show(fig)
```

![png](/logbook/public/img/nbexample/image2.png)

<hr>


What I was missing in the above conversion were the classical `In [1]:` and `Out[1]:` prompts of jupyter notebooks. So, how is this achievable? As Adam J. writes on [his blog](https://adamj.eu/tech/2014/09/21/using-ipython-notebook-to-write-jekyll-blog-posts/), `.ipynb` files are stored in the `json` format. And indeed if you look at the [raw content](https://raw.githubusercontent.com/mxbu/jupyter-notebooks/master/nbexample.ipynb) of the `nbexample.ipynb` you see something like this:

```{
 "cells": [
  {
   "cell_type": "code",
   "execution_count": 1,
   "metadata": {
    "collapsed": true
   },
   "outputs": [],
   "source": [
    "from pylab import *\n",
    "import numpy as np\n",
    "import pandas as pd"
   ]
  },  .....

```
This means I can get at the cells in the notebook, and I can easily convert the `.ipynb`- file to a `.md`-file. I found a [`ipynb_to_jekyll.py` on GitHub](https://gist.github.com/ewjoachim/570022bb7a08403cbe525fe82bd6d3e4), which I had to edit a few to satisfy my needs. Running `$ python ipynb_to_jekyll.py nbexample.ipynb` in the terminal creates/overwrites the relevant `nbexample.md` file and stores images in a folder. What follows is the code I used to convert my notebooks, if you cannot see the embedded gists, please <a  style="box-sizing: border-box; cursor: pointer; background: #f0f0f0;" onclick="PageReload()">
<span>refresh the page</span>
</a>  or you can have [a look at the gist on GitHub](https://gist.github.com/mxbu/a4a7a4e8d1a4dbb6439365ca0fb9ad25):

<a class="button" style="box-sizing: border-box; cursor: pointer; background: #f0f0f0; border: 2px solid; " onclick="hideshow()">
<span>show/hide gists</span>
</a>
<script type="text/javascript">
function PageReload() {
    location.reload(true);
}
</script>




<script>
function hideshow() {
    var x = document.getElementById('gist42182992');
    if (x.style.display === 'none') {
        x.style.display = 'block';
    } else {
        x.style.display = 'none';
    }
}
</script>


<script src="https://gist.github.com/mxbu/a4a7a4e8d1a4dbb6439365ca0fb9ad25.js"></script>

At the end there was one main reason to choose the 2nd approach, even though the first approach offers the possibility to define a template for the conversion. If you're interested in the latter, [this gist might be something for you](https://gist.github.com/dkmehrmann/3fd9e8b89a6e442fdc8787a4c1dbf4f2/).

* The main reason was the liberty, to do with the cells whatever python allows to do, and this is nearly everything.

### Result of `ipynb_to_jekyll.py`
The following is the outcome of the 2nd procedure, which fully meets my needs:


{% capture content %}{% highlight python %}
from pylab import *
import numpy as np
import pandas as pd
{% endhighlight %}{% endcapture %}
{% include notebook-cell.html execution_count="[1]:" content=content type='input' %}

{% capture content %}{% highlight python %}
x = np.linspace(0, 5, 10)
xx = np.linspace(-0.75, 1., 100)
n = np.array([0,1,2,3,4,5])
dates = pd.date_range('20130101', periods=6)
df = pd.DataFrame(np.random.randn(6,4), index=dates, columns=list('ABCD'))
df
{% endhighlight %}{% endcapture %}
{% include notebook-cell.html execution_count="[2]:" content=content type='input' %}
{% capture content %}
<div style="overflow-x: auto;-webkit-overflow-scrolling: touch;">
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>A</th>
      <th>B</th>
      <th>C</th>
      <th>D</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>2013-01-01</th>
      <td>2.278744</td>
      <td>-0.652785</td>
      <td>0.574983</td>
      <td>-0.408235</td>
    </tr>
    <tr>
      <th>2013-01-02</th>
      <td>0.886904</td>
      <td>-1.415350</td>
      <td>0.487806</td>
      <td>-0.117535</td>
    </tr>
    <tr>
      <th>2013-01-03</th>
      <td>1.280152</td>
      <td>0.451589</td>
      <td>2.450064</td>
      <td>-0.159981</td>
    </tr>
    <tr>
      <th>2013-01-04</th>
      <td>-0.163132</td>
      <td>0.141542</td>
      <td>1.810313</td>
      <td>2.263799</td>
    </tr>
    <tr>
      <th>2013-01-05</th>
      <td>-0.488827</td>
      <td>0.263963</td>
      <td>0.598489</td>
      <td>0.933941</td>
    </tr>
    <tr>
      <th>2013-01-06</th>
      <td>-1.589058</td>
      <td>0.054630</td>
      <td>1.425882</td>
      <td>0.133386</td>
    </tr>
  </tbody>
</table>
</div>
{% endcapture %}
{% include notebook-cell.html execution_count="[2]:" content=content type='output' %}

{% capture content %}{% highlight python %}
fig, axes = plt.subplots(1, 4, figsize=(12,3))

axes[0].scatter(xx, xx + 0.25*np.random.randn(len(xx)))
axes[0].set_title("scatter")

axes[1].step(n, n**2, lw=2)
axes[1].set_title("step")

axes[2].bar(n, n**2, align="center", width=0.5, alpha=0.5)
axes[2].set_title("bar")

axes[3].fill_between(x, x**2, x**3, color="green", alpha=0.5);
axes[3].set_title("fill_between");
show(fig)
{% endhighlight %}{% endcapture %}
{% include notebook-cell.html execution_count="[3]:" content=content type='input' %}
![png](/logbook/public/img/nbexample/image1.png)

{% capture content %}{% highlight python %}
# polar plot using add_axes and polar projection
fig = plt.figure()
ax = fig.add_axes([0.0, 0.0, .6, .6], polar=True)
t = np.linspace(0, 2 * np.pi, 100)
ax.plot(t, t, color='blue', lw=3);
show(fig)
{% endhighlight %}{% endcapture %}
{% include notebook-cell.html execution_count="[4]:" content=content type='input' %}
![png](/logbook/public/img/nbexample/image2.png)
