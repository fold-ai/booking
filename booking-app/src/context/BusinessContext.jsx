import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, supabaseReady } from '../supabase.js'
import { useAuth } from './AuthContext.jsx'
import { BUSINESS_TYPES, getBusinessType } from '../data/businessTypes.js'
import {
  fromBusiness, toBusiness,
  fromWorker, toWorker,
  fromClient, toClient,
  fromService, toService,
  fromBooking, toBooking,
  fromOffer, toOffer,
} from '../lib/mappers.js'

const BusinessContext = createContext(null)

const EMPTY = { business: null, workers: [], clients: [], services: [], bookings: [], offers: [] }

export function BusinessProvider({ children }) {
  const { user } = useAuth()
  const [state, setState] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const businessId = state.business?.id

  const refresh = useCallback(async () => {
    if (!supabaseReady || !user) { setState(EMPTY); return }
    setLoading(true); setError(null)
    try {
      const { data: biz, error: be } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()
      if (be) throw be
      if (!biz) { setState(EMPTY); return }
      const bid = biz.id
      const [w, c, s, b, o] = await Promise.all([
        supabase.from('workers').select('*').eq('business_id', bid).order('name'),
        supabase.from('clients').select('*').eq('business_id', bid).order('created_at', { ascending: false }),
        supabase.from('services').select('*').eq('business_id', bid).order('name'),
        supabase.from('bookings').select('*').eq('business_id', bid).order('start_at'),
        supabase.from('offers').select('*').eq('business_id', bid).order('created_at', { ascending: false }),
      ])
      if (w.error) throw w.error
      if (c.error) throw c.error
      if (s.error) throw s.error
      if (b.error) throw b.error
      if (o.error) throw o.error
      setState({
        business:  fromBusiness(biz),
        workers:   (w.data || []).map(fromWorker),
        clients:   (c.data || []).map(fromClient),
        services:  (s.data || []).map(fromService),
        bookings:  (b.data || []).map(fromBooking),
        offers:    (o.data || []).map(fromOffer),
      })
    } catch (e) {
      setError(e.message || String(e))
      setState(EMPTY)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  // --- mutations ---

  const createBusinessForUser = async ({ name, type, slug }) => {
    if (!user) throw new Error('Not signed in')
    const typeDef = getBusinessType(type)
    const payload = {
      ...toBusiness({
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'workspace',
        type,
        email: user.email,
        phone: null,
        city: null,
        hours: { start: 7, end: 18 },
        workdays: [1, 2, 3, 4, 5, 6],
        brandAccent: '#F4A93C',
      }),
      owner_id: user.id,
    }
    const { data: biz, error: be } = await supabase.from('businesses').insert(payload).select().single()
    if (be) throw be
    const defaults = (typeDef.defaultServices || []).map((s) => toService(
      { name: s.name, durationMin: s.durationMin, basePrice: s.basePrice, unit: s.unit, active: true },
      biz.id
    ))
    if (defaults.length) {
      const { error: se } = await supabase.from('services').insert(defaults)
      if (se) throw se
    }
    await refresh()
    return fromBusiness(biz)
  }

  const updateBusiness = async (patch) => {
    if (!businessId) return
    const merged = { ...state.business, ...patch }
    const { error } = await supabase
      .from('businesses')
      .update(toBusiness(merged))
      .eq('id', businessId)
    if (error) throw error
    await refresh()
  }

  const addWorker = async (w) => {
    if (!businessId) return
    const { error } = await supabase.from('workers').insert(toWorker(w, businessId))
    if (error) throw error
    await refresh()
  }
  const updateWorker = async (id, patch) => {
    const merged = { ...state.workers.find((x) => x.id === id), ...patch }
    const { error } = await supabase.from('workers').update(toWorker(merged, businessId)).eq('id', id)
    if (error) throw error
    await refresh()
  }
  const removeWorker = async (id) => {
    const { error } = await supabase.from('workers').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  const addClient = async (c) => {
    if (!businessId) return null
    const { data, error } = await supabase.from('clients').insert(toClient(c, businessId)).select().single()
    if (error) throw error
    await refresh()
    return fromClient(data)
  }
  const updateClient = async (id, patch) => {
    const merged = { ...state.clients.find((x) => x.id === id), ...patch }
    const { error } = await supabase.from('clients').update(toClient(merged, businessId)).eq('id', id)
    if (error) throw error
    await refresh()
  }
  const removeClient = async (id) => {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  const addService = async (s) => {
    if (!businessId) return
    const { error } = await supabase.from('services').insert(toService(s, businessId))
    if (error) throw error
    await refresh()
  }
  const updateService = async (id, patch) => {
    const merged = { ...state.services.find((x) => x.id === id), ...patch }
    const { error } = await supabase.from('services').update(toService(merged, businessId)).eq('id', id)
    if (error) throw error
    await refresh()
  }
  const removeService = async (id) => {
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  const addBooking = async (b) => {
    if (!businessId) return null
    const { data, error } = await supabase.from('bookings').insert(toBooking(b, businessId)).select().single()
    if (error) throw error
    await refresh()
    return fromBooking(data)
  }
  const updateBooking = async (id, patch) => {
    const merged = { ...state.bookings.find((x) => x.id === id), ...patch }
    const { error } = await supabase.from('bookings').update(toBooking(merged, businessId)).eq('id', id)
    if (error) throw error
    await refresh()
  }
  const removeBooking = async (id) => {
    const { error } = await supabase.from('bookings').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  const addOffer = async (o) => {
    if (!businessId) return
    const { error } = await supabase.from('offers').insert(toOffer(o, businessId))
    if (error) throw error
    await refresh()
  }
  const updateOffer = async (id, patch) => {
    const merged = { ...state.offers.find((x) => x.id === id), ...patch }
    const { error } = await supabase.from('offers').update(toOffer(merged, businessId)).eq('id', id)
    if (error) throw error
    await refresh()
  }
  const removeOffer = async (id) => {
    const { error } = await supabase.from('offers').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  const api = useMemo(() => ({
    ...state,
    loading,
    error,
    refresh,
    createBusinessForUser,
    updateBusiness,
    addWorker, updateWorker, removeWorker,
    addClient, updateClient, removeClient,
    addService, updateService, removeService,
    addBooking, updateBooking, removeBooking,
    addOffer, updateOffer, removeOffer,
    businessTypes: BUSINESS_TYPES,
  }), [state, loading, error, refresh])

  return <BusinessContext.Provider value={api}>{children}</BusinessContext.Provider>
}

export const useBusiness = () => useContext(BusinessContext)
