// src/modules/api/APIClient.js
// ✅ M31: Cliente API con Supabase
// Abstracción completa localStorage ↔ Supabase

import { createClient } from '@supabase/supabase-js'

// =====================================================
// CONFIGURACIÓN
// =====================================================

const CONFIG = {
  // ⚠️ Cambiar a true para usar Supabase
  useBackend: true,
  
  // Supabase config (desde .env)
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  
  // Opciones
  debug: import.meta.env.DEV,
  retries: 3,
  timeout: 10000
}

// =====================================================
// SUPABASE CLIENT
// =====================================================

let supabase = null

const getSupabase = () => {
  if (!supabase && CONFIG.supabaseUrl && CONFIG.supabaseKey) {
    supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  }
  return supabase
}

// =====================================================
// LOGGING HELPER
// =====================================================

const log = (action, data) => {
  if (CONFIG.debug) {
    console.log(`[API] ${action}:`, data)
  }
}

// =====================================================
// ADAPTADOR LOCALSTORAGE
// =====================================================

class LocalStorageAdapter {
  constructor(key) {
    this.key = key
  }

  async getAll() {
    const data = localStorage.getItem(this.key)
    return data ? JSON.parse(data) : []
  }

  async getById(id) {
    const all = await this.getAll()
    return all.find(item => item.id === id) || null
  }

  async query(filterFn) {
    const all = await this.getAll()
    return all.filter(filterFn)
  }

  async create(item) {
    const all = await this.getAll()
    all.push(item)
    localStorage.setItem(this.key, JSON.stringify(all))
    return item
  }

  async createMany(items) {
    const all = await this.getAll()
    const newAll = [...all, ...items]
    localStorage.setItem(this.key, JSON.stringify(newAll))
    return items
  }

  async update(id, updates) {
    const all = await this.getAll()
    const index = all.findIndex(item => item.id === id)
    if (index === -1) throw new Error(`Item ${id} not found`)
    
    all[index] = { ...all[index], ...updates, updatedAt: new Date().toISOString() }
    localStorage.setItem(this.key, JSON.stringify(all))
    return all[index]
  }

  async delete(id) {
    const all = await this.getAll()
    const filtered = all.filter(item => item.id !== id)
    localStorage.setItem(this.key, JSON.stringify(filtered))
    return true
  }

  async replaceAll(items) {
    localStorage.setItem(this.key, JSON.stringify(items))
    return items
  }

  async count() {
    const all = await this.getAll()
    return all.length
  }
}

// =====================================================
// ADAPTADOR SUPABASE
// =====================================================

class SupabaseAdapter {
  constructor(tableName) {
    this.table = tableName
  }

  async _getUserId() {
    const sb = getSupabase()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    return user.id
  }

  async getAll() {
    const sb = getSupabase()
    const userId = await this._getUserId()
    
    const { data, error } = await sb
      .from(this.table)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      log('ERROR getAll', { table: this.table, error })
      throw error
    }
    
    log('getAll', { table: this.table, count: data.length })
    return data
  }

  async getById(id) {
    const sb = getSupabase()
    const userId = await this._getUserId()
    
    const { data, error } = await sb
      .from(this.table)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      log('ERROR getById', { table: this.table, id, error })
      throw error
    }
    
    return data
  }

  async query(column, value) {
    const sb = getSupabase()
    const userId = await this._getUserId()
    
    const { data, error } = await sb
      .from(this.table)
      .select('*')
      .eq('user_id', userId)
      .eq(column, value)
    
    if (error) {
      log('ERROR query', { table: this.table, column, value, error })
      throw error
    }
    
    return data
  }

  async queryRange(column, start, end) {
    const sb = getSupabase()
    const userId = await this._getUserId()
    
    const { data, error } = await sb
      .from(this.table)
      .select('*')
      .eq('user_id', userId)
      .gte(column, start)
      .lte(column, end)
    
    if (error) throw error
    return data
  }

  async create(item) {
    const sb = getSupabase()
    const userId = await this._getUserId()
    
    const { data, error } = await sb
      .from(this.table)
      .insert({ ...item, user_id: userId })
      .select()
      .single()
    
    if (error) {
      log('ERROR create', { table: this.table, error })
      throw error
    }
    
    log('create', { table: this.table, id: data.id })
    return data
  }

  async createMany(items) {
    const sb = getSupabase()
    const userId = await this._getUserId()
    
    const itemsWithUser = items.map(item => ({ ...item, user_id: userId }))
    
    const { data, error } = await sb
      .from(this.table)
      .insert(itemsWithUser)
      .select()
    
    if (error) {
      log('ERROR createMany', { table: this.table, count: items.length, error })
      throw error
    }
    
    log('createMany', { table: this.table, count: data.length })
    return data
  }

  async update(id, updates) {
    const sb = getSupabase()
    const userId = await this._getUserId()
    
    // Remover campos que no deben actualizarse
    const { user_id, created_at, ...safeUpdates } = updates
    
    const { data, error } = await sb
      .from(this.table)
      .update({ ...safeUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) {
      log('ERROR update', { table: this.table, id, error })
      throw error
    }
    
    log('update', { table: this.table, id })
    return data
  }

  async delete(id) {
    const sb = getSupabase()
    const userId = await this._getUserId()
    
    const { error } = await sb
      .from(this.table)
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) {
      log('ERROR delete', { table: this.table, id, error })
      throw error
    }
    
    log('delete', { table: this.table, id })
    return true
  }

  async count() {
    const sb = getSupabase()
    const userId = await this._getUserId()
    
    const { count, error } = await sb
      .from(this.table)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    if (error) throw error
    return count
  }
}

// =====================================================
// FACTORY DE ADAPTADORES
// =====================================================

const createAdapter = (tableName, localStorageKey) => {
  if (CONFIG.useBackend) {
    return new SupabaseAdapter(tableName)
  }
  return new LocalStorageAdapter(localStorageKey)
}

// =====================================================
// REPOSITORIOS
// =====================================================

export const TransactionsRepository = {
  _adapter: null,
  
  get adapter() {
    if (!this._adapter) {
      this._adapter = createAdapter('transactions', 'transactions_v5')
    }
    return this._adapter
  },

  async getAll() {
    return this.adapter.getAll()
  },

  async getById(id) {
    return this.adapter.getById(id)
  },

  async getByMonth(month) {
    if (CONFIG.useBackend) {
      const startDate = `${month}-01`
      const endDate = `${month}-31`
      return this.adapter.queryRange('date', startDate, endDate)
    }
    return this.adapter.query(tx => tx.date?.startsWith(month))
  },

  async getByCategory(categoryId) {
    if (CONFIG.useBackend) {
      return this.adapter.query('category_id', categoryId)
    }
    return this.adapter.query(tx => tx.categoryId === categoryId)
  },

  async getByDateRange(startDate, endDate) {
    if (CONFIG.useBackend) {
      return this.adapter.queryRange('date', startDate, endDate)
    }
    return this.adapter.query(tx => tx.date >= startDate && tx.date <= endDate)
  },

  async create(transaction) {
    return this.adapter.create(transaction)
  },

  async createMany(transactions) {
    return this.adapter.createMany(transactions)
  },

  async update(id, updates) {
    return this.adapter.update(id, updates)
  },

  async delete(id) {
    return this.adapter.delete(id)
  },

  async count() {
    return this.adapter.count()
  }
}

export const CategoriesRepository = {
  _adapter: null,
  
  get adapter() {
    if (!this._adapter) {
      this._adapter = createAdapter('categories', 'categories_v5')
    }
    return this._adapter
  },

  async getAll() {
    return this.adapter.getAll()
  },

  async getById(id) {
    return this.adapter.getById(id)
  },

  async create(category) {
    return this.adapter.create(category)
  },

  async createMany(categories) {
    return this.adapter.createMany(categories)
  },

  async update(id, updates) {
    return this.adapter.update(id, updates)
  },

  async delete(id) {
    return this.adapter.delete(id)
  }
}

export const MonthlyBudgetsRepository = {
  _adapter: null,
  
  get adapter() {
    if (!this._adapter) {
      this._adapter = createAdapter('monthly_budgets', 'monthlyBudgets_v5')
    }
    return this._adapter
  },

  async getAll() {
    if (CONFIG.useBackend) {
      return this.adapter.getAll()
    }
    // localStorage guarda como objeto { month: { categoryId: { budget } } }
    const data = localStorage.getItem('monthlyBudgets_v5')
    return data ? JSON.parse(data) : {}
  },

  async getByMonth(month) {
    if (CONFIG.useBackend) {
      return this.adapter.query('month', month)
    }
    const all = await this.getAll()
    return all[month] || {}
  },

  async set(month, categoryId, budget) {
    if (CONFIG.useBackend) {
      // Buscar si existe
      const sb = getSupabase()
      const userId = await this.adapter._getUserId()
      
      const { data: existing } = await sb
        .from('monthly_budgets')
        .select('id')
        .eq('user_id', userId)
        .eq('month', month)
        .eq('category_id', categoryId)
        .single()
      
      if (existing) {
        return this.adapter.update(existing.id, { budget })
      }
      return this.adapter.create({ month, category_id: categoryId, budget })
    }
    
    // localStorage
    const all = await this.getAll()
    if (!all[month]) all[month] = {}
    all[month][categoryId] = { budget }
    localStorage.setItem('monthlyBudgets_v5', JSON.stringify(all))
    return { month, categoryId, budget }
  },

  async copyMonth(fromMonth, toMonth) {
    const fromBudgets = await this.getByMonth(fromMonth)
    
    if (CONFIG.useBackend) {
      const entries = Object.entries(fromBudgets)
      for (const [categoryId, { budget }] of entries) {
        await this.set(toMonth, categoryId, budget)
      }
      return true
    }
    
    const all = await this.getAll()
    all[toMonth] = { ...fromBudgets }
    localStorage.setItem('monthlyBudgets_v5', JSON.stringify(all))
    return true
  },

  async clearMonth(month) {
    if (CONFIG.useBackend) {
      const sb = getSupabase()
      const userId = await this.adapter._getUserId()
      
      await sb
        .from('monthly_budgets')
        .delete()
        .eq('user_id', userId)
        .eq('month', month)
      return true
    }
    
    const all = await this.getAll()
    delete all[month]
    localStorage.setItem('monthlyBudgets_v5', JSON.stringify(all))
    return true
  }
}

export const DebtsRepository = {
  _adapter: null,
  
  get adapter() {
    if (!this._adapter) {
      this._adapter = createAdapter('debts', 'debts_v5')
    }
    return this._adapter
  },

  async getAll() {
    return this.adapter.getAll()
  },

  async getById(id) {
    return this.adapter.getById(id)
  },

  async create(debt) {
    return this.adapter.create(debt)
  },

  async update(id, updates) {
    return this.adapter.update(id, updates)
  },

  async delete(id) {
    return this.adapter.delete(id)
  },

  async addPayment(debtId, payment) {
    if (CONFIG.useBackend) {
      const sb = getSupabase()
      
      // Insertar pago
      await sb.from('debt_payments').insert({
        debt_id: debtId,
        ...payment
      })
      
      // Actualizar balance
      const debt = await this.getById(debtId)
      return this.update(debtId, {
        current_balance: debt.current_balance - payment.amount
      })
    }
    
    // localStorage
    const debt = await this.getById(debtId)
    const payments = debt.payments || []
    payments.push({ ...payment, id: `pay_${Date.now()}` })
    return this.update(debtId, {
      payments,
      currentBalance: debt.currentBalance - payment.amount
    })
  }
}

export const SavingsRepository = {
  _adapter: null,
  
  get adapter() {
    if (!this._adapter) {
      this._adapter = createAdapter('savings_goals', 'savingsGoals_v5')
    }
    return this._adapter
  },

  async getAll() {
    return this.adapter.getAll()
  },

  async getById(id) {
    return this.adapter.getById(id)
  },

  async create(goal) {
    return this.adapter.create(goal)
  },

  async update(id, updates) {
    return this.adapter.update(id, updates)
  },

  async delete(id) {
    return this.adapter.delete(id)
  },

  async addContribution(goalId, contribution) {
    if (CONFIG.useBackend) {
      const sb = getSupabase()
      
      // Insertar contribución
      await sb.from('savings_contributions').insert({
        goal_id: goalId,
        ...contribution
      })
      
      // Actualizar monto actual
      const goal = await this.getById(goalId)
      return this.update(goalId, {
        current_amount: goal.current_amount + contribution.amount
      })
    }
    
    // localStorage
    const goal = await this.getById(goalId)
    const history = goal.contributionHistory || []
    history.push({ ...contribution, id: `cont_${Date.now()}` })
    return this.update(goalId, {
      contributionHistory: history,
      currentAmount: goal.currentAmount + contribution.amount
    })
  }
}

export const InvestmentsRepository = {
  _adapter: null,
  
  get adapter() {
    if (!this._adapter) {
      this._adapter = createAdapter('investment_platforms', 'investments_v5')
    }
    return this._adapter
  },

  async getAll() {
    return this.adapter.getAll()
  },

  async getById(id) {
    return this.adapter.getById(id)
  },

  async create(investment) {
    return this.adapter.create(investment)
  },

  async update(id, updates) {
    return this.adapter.update(id, updates)
  },

  async delete(id) {
    return this.adapter.delete(id)
  },

  async updateBalance(id, newBalance) {
    if (CONFIG.useBackend) {
      const sb = getSupabase()
      
      // Guardar en historial
      await sb.from('investment_balance_history').insert({
        platform_id: id,
        date: new Date().toISOString().split('T')[0],
        balance: newBalance
      })
    }
    
    return this.update(id, { 
      currentBalance: newBalance,
      current_balance: newBalance,
      lastUpdated: new Date().toISOString()
    })
  }
}

export const ExchangeRatesRepository = {
  async getCurrentRates() {
    if (CONFIG.useBackend) {
      const sb = getSupabase()
      const { data, error } = await sb
        .from('exchange_rates')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data || {}
    }
    
    const data = localStorage.getItem('exchangeRates_v5')
    return data ? JSON.parse(data) : {}
  },

  async saveCurrentRates(rates) {
    if (CONFIG.useBackend) {
      const sb = getSupabase()
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await sb
        .from('exchange_rates')
        .upsert({ 
          date: today,
          ...rates,
          source: 'app'
        }, { onConflict: 'date' })
        .select()
        .single()
      
      if (error) throw error
      return data
    }
    
    localStorage.setItem('exchangeRates_v5', JSON.stringify(rates))
    return rates
  },

  async getHistoricalRates() {
    if (CONFIG.useBackend) {
      const sb = getSupabase()
      const { data, error } = await sb
        .from('exchange_rates')
        .select('*')
        .order('date', { ascending: false })
        .limit(365)
      
      if (error) throw error
      
      // Convertir a formato { 'YYYY-MM-DD': rates }
      const history = {}
      data.forEach(row => {
        history[row.date] = {
          EUR_CLP: row.eur_clp,
          EUR_USD: row.eur_usd,
          CLP_UF: row.clp_uf
        }
      })
      return history
    }
    
    const data = localStorage.getItem('exchangeRatesHistory_v5')
    return data ? JSON.parse(data) : {}
  },

  async getRateForDate(date) {
    const history = await this.getHistoricalRates()
    
    if (history[date]) return history[date]
    
    // Buscar fecha más cercana anterior
    const dates = Object.keys(history).sort().reverse()
    const closest = dates.find(d => d <= date)
    return closest ? history[closest] : await this.getCurrentRates()
  },

  async saveHistoricalRate(date, rates) {
    if (CONFIG.useBackend) {
      const sb = getSupabase()
      
      const { data, error } = await sb
        .from('exchange_rates')
        .upsert({
          date,
          eur_clp: rates.EUR_CLP,
          eur_usd: rates.EUR_USD,
          clp_uf: rates.CLP_UF,
          source: 'import'
        }, { onConflict: 'date' })
      
      if (error) throw error
      return data
    }
    
    const history = await this.getHistoricalRates()
    history[date] = rates
    localStorage.setItem('exchangeRatesHistory_v5', JSON.stringify(history))
    return { date, rates }
  }
}

export const UserSettingsRepository = {
  async get() {
    if (CONFIG.useBackend) {
      const sb = getSupabase()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return null
      
      const { data, error } = await sb
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    }
    
    const data = localStorage.getItem('ynabConfig_v5')
    return data ? JSON.parse(data) : null
  },

  async save(settings) {
    if (CONFIG.useBackend) {
      const sb = getSupabase()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      const { data, error } = await sb
        .from('user_settings')
        .upsert({ 
          user_id: user.id,
          ...settings
        }, { onConflict: 'user_id' })
        .select()
        .single()
      
      if (error) throw error
      return data
    }
    
    localStorage.setItem('ynabConfig_v5', JSON.stringify(settings))
    return settings
  }
}

// =====================================================
// AUTH SERVICE
// =====================================================

export const AuthService = {
  async signUp(email, password, name) {
    const sb = getSupabase()
    
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    })
    
    if (error) throw error
    return data
  },

  async signIn(email, password) {
    const sb = getSupabase()
    
    const { data, error } = await sb.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },

  async signOut() {
    const sb = getSupabase()
    const { error } = await sb.auth.signOut()
    if (error) throw error
    return true
  },

  async getUser() {
    const sb = getSupabase()
    const { data: { user } } = await sb.auth.getUser()
    return user
  },

  async getSession() {
    const sb = getSupabase()
    const { data: { session } } = await sb.auth.getSession()
    return session
  },

  onAuthStateChange(callback) {
    const sb = getSupabase()
    return sb.auth.onAuthStateChange(callback)
  },

  async resetPassword(email) {
    const sb = getSupabase()
    const { error } = await sb.auth.resetPasswordForEmail(email)
    if (error) throw error
    return true
  }
}

// =====================================================
// MIGRATION SERVICE
// =====================================================

export const MigrationService = {
  async exportLocalData() {
    return {
      transactions: JSON.parse(localStorage.getItem('transactions_v5') || '[]'),
      categories: JSON.parse(localStorage.getItem('categories_v5') || '[]'),
      monthlyBudgets: JSON.parse(localStorage.getItem('monthlyBudgets_v5') || '{}'),
      debts: JSON.parse(localStorage.getItem('debts_v5') || '[]'),
      savingsGoals: JSON.parse(localStorage.getItem('savingsGoals_v5') || '[]'),
      investments: JSON.parse(localStorage.getItem('investments_v5') || '[]'),
      exchangeRates: JSON.parse(localStorage.getItem('exchangeRates_v5') || '{}'),
      exchangeRatesHistory: JSON.parse(localStorage.getItem('exchangeRatesHistory_v5') || '{}'),
      ynabConfig: JSON.parse(localStorage.getItem('ynabConfig_v5') || '{}')
    }
  },

  async migrateToSupabase(progressCallback = () => {}) {
    if (!CONFIG.useBackend) {
      throw new Error('Backend not enabled. Set CONFIG.useBackend = true')
    }

    const localData = await this.exportLocalData()
    const results = { success: [], errors: [] }

    try {
      // 1. Categories
      progressCallback('Migrando categorías...')
      if (localData.categories.length > 0) {
        await CategoriesRepository.adapter.createMany(
          localData.categories.map(c => ({
            ...c,
            parent_id: c.parentId || null
          }))
        )
        results.success.push(`${localData.categories.length} categorías`)
      }

      // 2. Transactions
      progressCallback('Migrando transacciones...')
      if (localData.transactions.length > 0) {
        // Dividir en batches de 500
        const batches = []
        for (let i = 0; i < localData.transactions.length; i += 500) {
          batches.push(localData.transactions.slice(i, i + 500))
        }
        
        for (const batch of batches) {
          await TransactionsRepository.adapter.createMany(
            batch.map(t => ({
              ...t,
              category_id: t.categoryId
            }))
          )
        }
        results.success.push(`${localData.transactions.length} transacciones`)
      }

      // 3. Debts
      progressCallback('Migrando deudas...')
      if (localData.debts.length > 0) {
        await DebtsRepository.adapter.createMany(
          localData.debts.map(d => ({
            ...d,
            original_amount: d.originalAmount,
            current_balance: d.currentBalance,
            monthly_payment: d.monthlyPayment,
            interest_rate: d.interestRate
          }))
        )
        results.success.push(`${localData.debts.length} deudas`)
      }

      // 4. Savings Goals
      progressCallback('Migrando metas de ahorro...')
      if (localData.savingsGoals.length > 0) {
        await SavingsRepository.adapter.createMany(
          localData.savingsGoals.map(s => ({
            ...s,
            target_amount: s.targetAmount,
            current_amount: s.currentAmount,
            target_date: s.targetDate
          }))
        )
        results.success.push(`${localData.savingsGoals.length} metas`)
      }

      // 5. Investments
      progressCallback('Migrando inversiones...')
      if (localData.investments.length > 0) {
        await InvestmentsRepository.adapter.createMany(
          localData.investments.map(i => ({
            ...i,
            current_balance: i.currentBalance
          }))
        )
        results.success.push(`${localData.investments.length} inversiones`)
      }

      // 6. Monthly Budgets
      progressCallback('Migrando presupuestos mensuales...')
      const budgetEntries = Object.entries(localData.monthlyBudgets)
      for (const [month, categories] of budgetEntries) {
        for (const [categoryId, { budget }] of Object.entries(categories)) {
          await MonthlyBudgetsRepository.set(month, categoryId, budget)
        }
      }
      results.success.push(`${budgetEntries.length} meses de presupuesto`)

      // 7. Exchange Rates
      progressCallback('Migrando tasas de cambio...')
      const rateEntries = Object.entries(localData.exchangeRatesHistory)
      for (const [date, rates] of rateEntries) {
        await ExchangeRatesRepository.saveHistoricalRate(date, rates)
      }
      results.success.push(`${rateEntries.length} días de tasas`)

      // 8. Settings
      progressCallback('Migrando configuración...')
      if (Object.keys(localData.ynabConfig).length > 0) {
        await UserSettingsRepository.save({
          monthly_income: localData.ynabConfig.monthlyIncome,
          income_currency: localData.ynabConfig.currency,
          display_currency: localData.ynabConfig.displayCurrency || 'EUR'
        })
        results.success.push('Configuración')
      }

      progressCallback('¡Migración completada!')
      return { success: true, results }
      
    } catch (error) {
      results.errors.push(error.message)
      return { success: false, results, error }
    }
  }
}

// =====================================================
// SYNC SERVICE (para offline-first)
// =====================================================

export const SyncService = {
  pendingChanges: [],
  
  async queueChange(entity, action, data) {
    this.pendingChanges.push({
      entity,
      action,
      data,
      timestamp: Date.now(),
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    })
    
    // Guardar en localStorage para persistir entre recargas
    localStorage.setItem('pendingSync', JSON.stringify(this.pendingChanges))
    
    // Intentar sync si hay conexión
    if (navigator.onLine && CONFIG.useBackend) {
      this.processPending()
    }
  },

  async processPending() {
    const pending = JSON.parse(localStorage.getItem('pendingSync') || '[]')
    const failed = []

    for (const change of pending) {
      try {
        const repo = this._getRepository(change.entity)
        await repo[change.action](change.data)
      } catch (error) {
        log('Sync failed', { change, error })
        failed.push(change)
      }
    }

    // Guardar solo los que fallaron
    localStorage.setItem('pendingSync', JSON.stringify(failed))
    this.pendingChanges = failed
    
    return {
      processed: pending.length - failed.length,
      failed: failed.length
    }
  },

  _getRepository(entity) {
    const repos = {
      transactions: TransactionsRepository,
      categories: CategoriesRepository,
      debts: DebtsRepository,
      savings: SavingsRepository,
      investments: InvestmentsRepository
    }
    return repos[entity]
  },

  getPendingCount() {
    return JSON.parse(localStorage.getItem('pendingSync') || '[]').length
  }
}

// Listener para cuando vuelve la conexión
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (CONFIG.useBackend) {
      SyncService.processPending()
    }
  })
}

// =====================================================
// EXPORTS
// =====================================================

export const isBackendEnabled = () => CONFIG.useBackend
export const enableBackend = () => { CONFIG.useBackend = true }
export const disableBackend = () => { CONFIG.useBackend = false }
export const getSupabaseClient = getSupabase

export default {
  // Repositories
  TransactionsRepository,
  CategoriesRepository,
  MonthlyBudgetsRepository,
  DebtsRepository,
  SavingsRepository,
  InvestmentsRepository,
  ExchangeRatesRepository,
  UserSettingsRepository,
  
  // Services
  AuthService,
  MigrationService,
  SyncService,
  
  // Utils
  isBackendEnabled,
  enableBackend,
  disableBackend,
  getSupabaseClient,
  CONFIG
}