import { and, eq, isNull, sql, inArray, like, or, type SQL } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { assets, companies, divisions, assetDepreciationLogs, assetDepreciationRuns } from '~~/server/db/schema'
import { users } from '~~/server/db/schema/auth'
import { requireAuth } from '~~/server/utils/requireAuth'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const db = useDb()
  const query = getQuery(event)

  const conditions: SQL[] = [isNull(assets.deletedAt)]

  if (query.roomId) {
    const roomIds = String(query.roomId).split(',').map(Number).filter(Boolean)
    if (roomIds.length > 0) {
      conditions.push(inArray(assets.roomId, roomIds))
    }
  }

  if (query.ptId) {
    const ptIds = String(query.ptId).split(',').map(Number).filter(Boolean)
    if (ptIds.length > 0) {
      conditions.push(inArray(assets.ptId, ptIds))
    }
  }

  if (query.manufactureId) {
    const mfgIds = String(query.manufactureId).split(',').map(Number).filter(Boolean)
    if (mfgIds.length > 0) {
      conditions.push(inArray(assets.manufactureId, mfgIds))
    }
  }

  if (query.location) {
    conditions.push(like(assets.location, `%${String(query.location).trim()}%`))
  }

  if (query.category) {
    conditions.push(eq(assets.category, String(query.category)))
  }

  if (query.search) {
    const searchVal = `%${String(query.search).trim()}%`
    conditions.push(
      or(
        like(assets.name, searchVal),
        like(assets.code, searchVal),
        like(assets.description, searchVal)
      ) as SQL
    )
  }

  // 1. Fetch all active assets matching conditions
  const activeAssets = await db
    .select({
      id: assets.id,
      code: assets.code,
      name: assets.name,
      purchaseFromDate: assets.purchaseFromDate,
      purchaseToDate: assets.purchaseToDate,
      economicAge: assets.economicAge, // in months
      price: assets.price,
      ptCode: companies.code,
      divisionName: divisions.name,
      category: assets.category,
    })
    .from(assets)
    .innerJoin(companies, eq(assets.ptId, companies.id))
    .innerJoin(divisions, eq(assets.divisi, divisions.id))
    .where(and(...conditions))
    .orderBy(sql`${assets.createdAt} DESC`)

  // 2. Fetch all depreciation logs
  const logs = await db
    .select({
      id: assetDepreciationLogs.id,
      assetId: assetDepreciationLogs.assetId,
      periodDate: assetDepreciationLogs.periodDate,
      amount: assetDepreciationLogs.amount,
      remainingAge: assetDepreciationLogs.remainingAge,
      remainingValue: assetDepreciationLogs.remainingValue,
    })
    .from(assetDepreciationLogs)

  // 3. Fetch all depreciation run executions for history table
  const runs = await db
    .select({
      id: assetDepreciationRuns.id,
      periodDate: assetDepreciationRuns.periodDate,
      totalAssets: assetDepreciationRuns.totalAssets,
      totalAmount: assetDepreciationRuns.totalAmount,
      executorName: users.email, // fallback if full name not loaded
      createdAt: assetDepreciationRuns.createdAt,
    })
    .from(assetDepreciationRuns)
    .innerJoin(users, eq(assetDepreciationRuns.createdBy, users.id))
    .orderBy(sql`${assetDepreciationRuns.createdAt} DESC`)

  // 4. Calculate dynamic month columns
  // Fixed bounds starting from Jan 2018
  let minDateStr = '2018-01-01'
  let maxDateStr = new Date().toISOString().slice(0, 10)

  // Scan logs periods for max bounds
  for (const l of logs) {
    if (l.periodDate > maxDateStr) {
      maxDateStr = l.periodDate
    }
  }

  // Helper to get all months between start and end date
  const columns: Array<{ dateKey: string; label: string }> = []
  const start = new Date(minDateStr)
  const end = new Date(maxDateStr)
  
  // Align start date to the 1st of that month
  const curr = new Date(start.getFullYear(), start.getMonth(), 1)
  // Run up to current month or latest log month (whichever is later)
  const today = new Date()
  const latestMonth = new Date(Math.max(end.getTime(), today.getTime()))
  const limit = new Date(latestMonth.getFullYear(), latestMonth.getMonth(), 1)

  while (curr <= limit) {
    const y = curr.getFullYear()
    const m = curr.getMonth()
    const dateKey = `${y}-${String(m + 1).padStart(2, '0')}-01`
    const label = curr.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    columns.push({ dateKey, label })
    curr.setMonth(curr.getMonth() + 1)
  }

  // 5. Aggregate asset records with logs in-memory
  const assetsData = activeAssets.map((asset) => {
    const assetLogs = logs.filter((l) => l.assetId === asset.id)
    const loggedCount = assetLogs.length
    const totalDepreciated = assetLogs.reduce((sum, l) => sum + Number(l.amount), 0)

    const sisaMasaManfaat = Math.max(0, asset.economicAge - loggedCount)
    const nilaiSisaManfaat = Math.max(0, Number(asset.price) - totalDepreciated)

    // Map month periodDate to amount
    const monthlyValues: Record<string, number> = {}
    for (const l of assetLogs) {
      monthlyValues[l.periodDate] = Number(l.amount)
    }

    return {
      id: asset.id,
      code: asset.code || '-',
      name: asset.name,
      purchaseFromDate: asset.purchaseFromDate,
      purchaseToDate: asset.purchaseToDate,
      economicAge: asset.economicAge,
      price: asset.price,
      ptCode: asset.ptCode,
      divisionName: asset.divisionName,
      category: asset.category,
      kaliDisusutkan: `${loggedCount} / ${asset.economicAge}`,
      sisaMasaManfaat,
      nilaiSisaManfaat,
      monthlyValues,
    }
  })

  return {
    data: {
      assets: assetsData,
      columns,
      history: runs,
    },
  }
})
