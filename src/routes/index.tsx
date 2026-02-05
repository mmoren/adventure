import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import sql from '../sql'
import { z } from 'zod'

async function readCount() {
  const [result] = await sql<
    { id: number; count: number }[]
  >`SELECT id, count FROM counter LIMIT 1`
  return { id: result.id, count: result.count }
}

const getCount = createServerFn({
  method: 'GET',
}).handler(async () => {
  return await readCount()
})

const UpdateCountSchema = z.object({
  id: z.number().int(),
  increment: z.number().int(),
})

const updateCount = createServerFn({ method: 'POST' })
  .inputValidator(UpdateCountSchema)
  .handler(async ({ data }) => {
    const [result] = await sql<
      { count: number }[]
    >`UPDATE counter SET count = count + ${data.increment} WHERE id = ${data.id} RETURNING count`
    return { count: result.count }
  })

export const Route = createFileRoute('/')({
  component: Home,
  loader: async () => await getCount(),
})

function Home() {
  const state = Route.useLoaderData()
  const [count, setCount] = useState(state.count)

  return (
    <button
      type="button"
      onClick={async () => {
        const updated = await updateCount({
          data: { id: state.id, increment: 1 },
        })
        setCount(updated.count)
      }}
    >
      Add 1 to {count}?
    </button>
  )
}
