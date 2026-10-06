import re
import os

filepath = r'c:\Users\ADMIN\Desktop\fintrack\frontend\src\pages\Insights.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# We want to replace everything inside <main className="..."> ... </main>
main_regex = re.compile(r'(<main[^>]*>)(.*?)(</main>)', re.DOTALL)

new_main_content = """<div className="flex flex-col w-full">
{/*  Sub-Header / Context Meta Strip  */}
<div className="flex flex-col md:flex-row md:items-end justify-between pb-space-lg gap-space-sm">
  <div className="flex flex-col">
    <h1 className="font-headline-lg text-headline-lg text-primary-container tracking-tight mt-0.5">AI Insights</h1>
    <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">Ask questions about your spending and see forecasts for next month.</p>
  </div>
</div>

{/*  SECTION 1: Natural Language Structured Query Engine  */}
<section className="flex flex-col gap-space-md mb-space-xl">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-space-sm">
      <div className="w-2 h-2 rounded-full bg-primary-container"></div>
      <h2 className="font-headline-md text-headline-md text-primary-container">Ask FinTrack</h2>
    </div>
  </div>

  <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md">
    <div className="flex flex-col gap-space-xs">
      <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold" htmlFor="nl-query-input">What do you want to know?</label>
      <div className="relative flex items-center">
        <span className="absolute left-space-md material-symbols-outlined text-outline text-[20px]">search</span>
        <input 
          className="w-full bg-surface-container-low pl-11 pr-32 py-2.5 rounded-lg text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container outline-none transition-all placeholder:text-outline" 
          id="nl-query-input" 
          placeholder="Ask a question..." 
          type="text" 
          value={nlQuery}
          onChange={(e) => setNlQuery(e.target.value)}
        />
        <div className="absolute right-2 flex items-center gap-1">
          <button className="px-space-xs py-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors font-label-sm text-label-sm" onClick={() => setNlQuery('')} type="button">Clear</button>
          <button className="px-space-md py-1.5 rounded-lg bg-primary-container hover:bg-inverse-surface text-on-primary font-label-md text-label-md flex items-center gap-1 transition-colors" onClick={handleNlSearch} disabled={loadingNl} type="button">
            <span>{loadingNl ? 'Running...' : 'Execute'}</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>

    {nlResult && (
      <div className="rounded-lg bg-surface-container-low p-space-md flex flex-col gap-space-sm mt-space-xs transition-opacity duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs pb-space-xs">
          <div className="flex items-center gap-space-xs">
            <span className="px-space-xs py-0.5 rounded-lg bg-surface-container-highest text-primary-container font-label-sm text-label-sm font-semibold uppercase">Result</span>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-center py-space-xs">
          <div className="lg:col-span-12 flex flex-col">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">Total Amount</span>
            <div className="flex items-baseline gap-space-xs mt-0.5">
              <span className="font-headline-lg text-headline-lg text-primary-container font-semibold">₹{Number(nlResult.totalAmount).toLocaleString()}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">across {nlResult.count} transactions</span>
            </div>
          </div>
        </div>
        <div className="pt-space-xs flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
          <div className="flex items-start sm:items-center gap-space-xs">
            <span className="material-symbols-outlined text-[16px] text-secondary mt-0.5 sm:mt-0">code</span>
            <code className="font-numeric-sm text-numeric-sm text-on-surface-variant bg-surface-container-highest px-space-xs py-0.5 rounded-lg break-all">
              {nlResult.sql_used}
            </code>
          </div>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold shrink-0">Generated via SQL</span>
        </div>
      </div>
    )}
  </div>
</section>

{/*  SECTION 2: Predictive Forecast Engine  */}
<section className="flex flex-col gap-space-md mb-space-xl">
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-xs">
    <div>
      <div className="flex items-center gap-space-sm">
        <div className="w-2 h-2 rounded-full bg-secondary"></div>
        <h2 className="font-headline-md text-headline-md text-primary-container">Next Month Spend Forecast</h2>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Based on your past 3 months of spending habits.</p>
    </div>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
    {predictionData && Object.entries(predictionData).map(([category, data]) => (
      <div key={category} className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary-container text-[20px]">{category === 'Groceries' ? 'shopping_cart' : category === 'Utilities' ? 'bolt' : 'restaurant'}</span>
              <span className="font-headline-sm text-headline-sm text-primary-container">{category}</span>
            </div>
            <span className={`flex items-center gap-0.5 px-space-xs py-0.5 rounded-lg font-numeric-sm text-numeric-sm font-semibold ${data.trend.includes('-') ? 'bg-secondary-fixed text-on-secondary-fixed-variant' : 'bg-surface-container-high text-error'}`}>
              <span className="material-symbols-outlined text-[14px]">{data.trend.includes('-') ? 'trending_down' : 'trending_up'}</span>
              {data.trend}
            </span>
          </div>
          <div className="mt-space-md flex items-baseline gap-space-xs">
            <span className="font-headline-lg text-headline-lg font-semibold text-primary-container">₹{data.value.toLocaleString()}</span>
            <span className="font-label-sm text-label-sm text-outline uppercase font-semibold">est. projected</span>
          </div>
          <div className="py-space-sm">
             <div className="flex items-center justify-between text-on-surface-variant font-numeric-sm text-numeric-sm mb-1">
               {Object.entries(data.months).map(([m, v]) => (
                 <span key={m}>{m}: ₹{(v/1000).toFixed(1)}k</span>
               ))}
             </div>
          </div>
        </div>
      </div>
    ))}
  </div>
</section>

{/*  SECTION 3: Anomaly Detection & Outliers  */}
<section className="flex flex-col gap-space-md">
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
    <div className="flex items-center gap-space-sm">
      <div className="w-2 h-2 rounded-full bg-error"></div>
      <div>
        <h2 className="font-headline-md text-headline-md text-primary-container">Unusual Transactions</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">We noticed a few transactions that look different from your usual spending.</p>
      </div>
    </div>
    <div className="flex items-center gap-1.5 px-space-md py-1 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed self-start sm:self-auto shadow-sm">
      <span className="material-symbols-outlined text-[16px] text-on-tertiary-container">warning</span>
      <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">{anomalies.length} flagged items requiring review</span>
    </div>
  </div>

  <div className="flex flex-col gap-space-sm">
    {anomalies.length === 0 ? (
       <p className="text-on-surface-variant p-4 text-center">No anomalies detected.</p>
    ) : anomalies.map((anomaly, idx) => (
      <div key={idx} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
        <div className="flex items-start gap-space-md min-w-0">
          <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-primary-container">
            <span className="material-symbols-outlined text-[22px]">warning</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex flex-wrap items-center gap-space-xs">
              <span className="font-headline-sm text-headline-sm text-on-surface font-medium">{anomaly.merchant}</span>
              <span className="px-space-xs py-0.5 rounded-lg bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold uppercase">High Spend</span>
              <span className="font-numeric-sm text-numeric-sm text-outline">{new Date(anomaly.date).toLocaleDateString()}</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{anomaly.reason}</p>
          </div>
        </div>
        <div className="flex items-center justify-between lg:justify-end gap-space-lg shrink-0 pt-space-xs lg:pt-0">
          <div className="flex flex-col text-right">
            <span className="font-numeric-lg text-numeric-lg text-primary-container font-semibold">₹{Number(anomaly.amount).toLocaleString()}</span>
            <span className="font-label-sm text-label-sm text-outline">{anomaly.category}</span>
          </div>
        </div>
      </div>
    ))}
  </div>
</section>
</div>"""

updated_content = main_regex.sub(rf'\g<1>{new_main_content}\g<3>', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(updated_content)

print("Insights UI dynamic mapping complete.")
