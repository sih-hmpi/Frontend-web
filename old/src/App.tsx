import './App.css'
import React, { Suspense } from 'react'
import WaterQualityTable from './cswb'

function App() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Water Quality Data</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <WaterQualityTable />
      </Suspense>
    </div>
  )
}

export default App