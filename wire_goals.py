import re

filepath = r'c:\Users\ADMIN\Desktop\fintrack\frontend\src\pages\Budgets.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state for goals
state_regex = re.compile(r'(const \[budgets, setBudgets\] = useState\(\[\]\);)')
content = state_regex.sub(r'\1\n  const [goals, setGoals] = useState([]);', content)

# 2. Fetch goals in useEffect
load_budgets_regex = re.compile(r'(loadBudgets\(\);\n\s*apiClient\.get\(\'/categories\'\))')
new_load_logic = """loadBudgets();
    apiClient.get('/goals').then(res => setGoals(res.data.data)).catch(console.error);
    apiClient.get('/categories')"""
content = load_budgets_regex.sub(new_load_logic, content)

# 3. Replace the static Goals Grid
goals_grid_regex = re.compile(r'(<!--\s*Goal 1: Emergency Fund.*?)(<div className="pt-space-xl">)', re.DOTALL)
new_goals_grid = """
{goals.length === 0 ? <div className="text-on-surface">No goals found. Create one!</div> : 
  goals.map((goal, i) => (
    <div key={i} className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col justify-between border-l-4 border-l-secondary relative overflow-hidden group">
      <div className="flex flex-col gap-space-sm relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">{goal.status}</span>
            <span className="font-headline-sm text-headline-sm text-on-surface mt-1">{goal.name}</span>
          </div>
          <div className="p-2 rounded-lg bg-surface-container-low text-secondary group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[20px]">account_balance</span>
          </div>
        </div>
        <div className="mt-space-md flex flex-col gap-1">
          <div className="flex items-end justify-between">
            <span className="font-numeric-lg text-numeric-lg font-bold text-on-surface">₹{Number(goal.current_amount).toLocaleString()}</span>
            <span className="font-numeric-md text-numeric-md text-outline">/ ₹{Number(goal.target_amount).toLocaleString()}</span>
          </div>
          <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden mt-2">
            <div className="h-full bg-secondary rounded-full" style={{ width: `${Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))}%` }}></div>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="font-label-sm text-label-sm text-secondary font-semibold">{Math.round((goal.current_amount / goal.target_amount) * 100)}% Funded</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant text-right">Target: {goal.target_date ? new Date(goal.target_date).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  ))
}
</div>
"""
content = goals_grid_regex.sub(new_goals_grid + r'\2', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Goals wiring complete.")
