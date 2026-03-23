# 📅 Týdenní Plánovač

AI-powered týdenní plánovač s přihlášením, databází a sdílením plánů.

## 🚀 Jak spustit

### 1. Nastav databázi v Supabase
1. Jdi na https://supabase.com/dashboard/project/jnduplgjjytwbvodesbc/editor
2. Zkopíruj obsah souboru `supabase-setup.sql`
3. Vlož ho do SQL editoru a klikni **Run**

### 2. Přidej Anthropic API klíč
Otevři soubor `.env.local` a doplň svůj Anthropic API klíč:
```
ANTHROPIC_API_KEY=sk-ant-...
```
Klíč získáš na: https://console.anthropic.com/

### 3. Nahraj na GitHub a deployuj na Vercel

#### GitHub:
1. Jdi na https://github.com/new
2. Vytvoř nový repozitář (např. `tydenni-planovac`)
3. Nahraj všechny soubory

#### Vercel:
1. Jdi na https://vercel.com/new
2. Importuj svůj GitHub repozitář
3. V sekci **Environment Variables** přidej:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://jnduplgjjytwbvodesbc.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (tvůj anon key)
   - `ANTHROPIC_API_KEY` = (tvůj Anthropic klíč)
4. Klikni **Deploy**

## ✨ Funkce
- 🔐 Přihlášení / registrace (email + heslo)
- ✅ Přidávání úkolů s prioritou, časem a termínem
- 🤖 AI generování týdenního rozvrhu
- 💾 Ukládání plánů do databáze
- 📋 Historie plánů
- 🔗 Sdílení plánu odkazem
