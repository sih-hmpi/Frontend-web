import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { WellData } from '@/models/WellData';

export async function POST(req: Request) {
  try {
    await connectDB();
    console.log('Connected to MongoDB successfully');

    const data = await req.json();
    console.log(`Received ${data.length} records to save`);

    const transformedData = data.map((row: any) => {
      const measurements: Record<string, number | null> = {};
      
      Object.entries(row).forEach(([key, value]) => {
        if (key.includes('19') || key.includes('20')) {
          measurements[key] = value === 'NA' ? null : Number(value);
        }
      });

      return {
        STATE: row.STATE || '',
        DISTRICT: row.DISTRICT || '',
        LAT: Number(row.LAT) || 0,
        LON: Number(row.LON) || 0,
        SITE_TYPE: row.SITE_TYPE || '',
        WLCODE: row.WLCODE || '',
        measurements
      };
    });

    // Use updateOne with upsert instead of insertMany
    const operations = transformedData.map(doc => ({
      updateOne: {
        filter: { WLCODE: doc.WLCODE },
        update: { $set: doc },
        upsert: true
      }
    }));

    const batchSize = 100;
    let successCount = 0;

    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const result = await WellData.bulkWrite(batch);
      successCount += (result.upsertedCount + result.modifiedCount);
      console.log(`Processed batch ${i/batchSize + 1}/${Math.ceil(operations.length/batchSize)}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Data saved successfully',
      count: successCount
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

// GET endpoint to fetch data
export async function GET() {
  try {
    await connectDB();
    const data = await WellData.find({});
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}