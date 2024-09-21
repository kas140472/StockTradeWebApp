const axios = require('axios');
const express = require('express');
const app = express();
var cors = require("cors");
app.use(cors());
const { format } = require('date-fns');
const path = require('path');
const bodyParser = require('body-parser');


var jsonParser = bodyParser.json()

app.use(express.static(path.join(__dirname, 'dist','my-angular-project','browser')));

const multer=require("multer");

const { MongoClient } = require("mongodb");

var uri = "mongodb+srv://kritishukla0114:kasmal140472@cscihw3.c2x8kko.mongodb.net/?retryWrites=true&w=majority&appName=csciHw3";

const client = new MongoClient(uri);

async function connectMongoDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

connectMongoDB();

const database = client.db("todoappdb");
const movies = database.collection('todoappcollection');
const companyData = database.collection('watchlist');

const watchlistData = database.collection('watchlist');
const portfolioData = database.collection('portfolio');
const currentWalletValue = database.collection('walletValue');

app.get('/api/todoapp/getnotes', async (request, response) => {
  const movie2 = await movies.find({}).toArray();
  response.send(movie2);
});

app.get('/api/todoapp/getdata', async (request, response) => {
  const getCompanyData = await companyData.find({}).toArray();
  response.send(getCompanyData);
});

app.get('/api/todoapp/getportdata', async (request, response) => {
  const getPortfolioData = await portfolioData.find({}).toArray();
  // console.log("Node getportdata: ", getPortfolioData);
  response.send(getPortfolioData);
});

app.get('/api/todoapp/getwatchdata', async (request, response) => {
  const getWatchlistData = await watchlistData.find({}).toArray();
  // console.log("Node getwatchdata: ", getWatchlistData);
  response.send(getWatchlistData);
});

app.get('/api/todoapp/gettickerportdata/:ticker', async (request, response) => {
  const ticker = request.params.ticker;
  const query = { ticker: ticker }; // Assuming the field name in the collection is 'ticker'
  
  try {
    const portfolioItem = await portfolioData.findOne(query);
    if (portfolioItem) {
      response.send(portfolioItem);
    } else {
      response.status(404).json({ error: 'Portfolio item not found' });
    }
  } catch (error) {
    console.error('Error retrieving portfolio data:', error);
    response.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/todoapp/getwalletdata', async (request, response) => {
  const getWalletData = await currentWalletValue.find({}).toArray();
  response.send(getWalletData);
});

app.post('/api/todoapp/addnotes', multer().none(), async (request, response) => {
  try {
    const numOfDocs = await movies.countDocuments({});
    const newNote = {
      id: (numOfDocs + 1).toString(),
      description: request.body.newNotes
    };
    await movies.insertOne(newNote);
    response.json("Note added successfully");
  } catch (error) {
    console.error("Error adding note:", error);
    response.status(500).json("Internal Server Error");
  }
});

app.post('/api/todoapp/adddata', multer().none(), async (request, response) => {
  try {
    const numOfDocs1 = await companyData.countDocuments({});
    const newNote1 = {
      id: (numOfDocs1 + 1).toString(),
      name: request.body.nameData,
      ticker: request.body.tickerData,
      c: request.body.cData,
      d: request.body.dData,
      dp: request.body.dpData
    };
    await companyData.insertOne(newNote1);
    response.json("Data added successfully");
  } catch (error) {
    console.error("Error adding note:", error);
    response.status(500).json("Internal Server Error");
  }
});

app.post('/api/todoapp/addportdata', multer().none(), async (request, response) => {
  const numOfDocs2 = await portfolioData.countDocuments({});
  const id = (numOfDocs2 + 1).toString();
  const ticker = request.body.tickerData;
  const name = request.body.nameData;
  const quantityData = parseInt(request.body.quantityData); // Parse quantity to ensure it's a number
  const totalCostData = parseFloat(request.body.totalCostData); // Parse totalCost to ensure it's a number
  const buyOrSell = request.body.buyOrSellData;

  console.log("server.js ticker: ", ticker);
  const query = { ticker: ticker };

  try {
    const existingPortfolioItem = await portfolioData.findOne(query);

    if (existingPortfolioItem) {
      let updatedQuantity = 0;
      let updatedTotalCost = 0;
      if(buyOrSell == 'buy')
      {
        updatedQuantity = existingPortfolioItem.quantityData + quantityData;
        updatedTotalCost = existingPortfolioItem.totalCostData + totalCostData;
      }
      else {
        updatedQuantity = existingPortfolioItem.quantityData - quantityData;
        updatedTotalCost = existingPortfolioItem.totalCostData - totalCostData;
      }   
      await portfolioData.updateOne(query, { $set: { quantityData: updatedQuantity, totalCostData: updatedTotalCost } });
      response.status(200).json({ message: 'Portfolio item updated successfully' });
    } else {
      const newPortfolioItem = { ticker, name, quantityData, totalCostData };
      await portfolioData.insertOne(newPortfolioItem);
      response.status(201).json({ message: 'Portfolio item added successfully' });
    }
  } catch (error) {
    console.error('Error adding/updating portfolio data:', error);
    response.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/api/todoapp/updatewalletdata',jsonParser, async (request, response) => {
  try {
    const filter = {};
    console.log("server request body: ", request.body);
    const update = {
      $set: {
        curWalletValue: request.body.curWalletValue,
      },
    };
    const options = {
      upsert: true,
    };
    const result = await currentWalletValue.updateOne(filter, update, options);

    if (result.modifiedCount === 1) {
      response.json("Data updated successfully");
    } else {
      response.json("No document updated");
    }
  } catch (error) {
    console.error("Error updating data:", error);
    response.status(500).json("Internal Server Error");
  }
});


app.delete('/api/todoapp/deletenotes', multer().none(),(request,response)=>{
    movies.deleteOne({
      id:request.query.id
    });
    response.json("todo deleted successfully");
  });

  app.delete('/api/todoapp/deletedata', multer().none(),(request,response)=>{
    companyData.deleteOne({
      id:request.query.id
    });
    response.json("comp deleted successfully");
  });

  app.delete('/api/todoapp/deletewatchlist/:ticker', async (request, response) => {
    const ticker = request.params.ticker;
    console.log("here in server.js delete watchlist item: ", ticker);
    try {
      const result = await watchlistData.deleteOne({ ticker: ticker });
  
      if (result.deletedCount === 1) {
        response.status(200).json({ message: 'Item deleted successfully' });
      } else {
        response.status(404).json({ error: 'Item not found' });
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      response.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/todoapp/deleteportfolio/:ticker', async (request, response) => {
    const ticker = request.params.ticker;
    console.log("here in server.js delete portfolio item: ", ticker);
    try {
      const result = await portfolioData.deleteOne({ ticker: ticker });
  
      if (result.deletedCount === 1) {
        response.status(200).json({ message: 'Item deleted successfully' });
      } else {
        response.status(404).json({ error: 'Item not found' });
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      response.status(500).json({ error: 'Internal server error' });
    }
  });
  
  


  app.get('/company-profile', async (req, res) => {
    console.log('Request received for /company-profile');
    const symbol = req.query.symbol; // Get the symbol from the query parameter
    
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=cn11b0hr01quegsk70ngcn11b0hr01quegsk70o0`);
      const companyProfile = response.data;
  
      const autoCompResponse = await axios.get(`https://finnhub.io/api/v1/search?q=${symbol}&token=cn11b0hr01quegsk70ngcn11b0hr01quegsk70o0`);
      const autoCompData = autoCompResponse.data;
  
      const quoteResponse = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=cn11b0hr01quegsk70ngcn11b0hr01quegsk70o0`);
      const quoteData = quoteResponse.data;

      const peersResponse = await axios.get(`https://finnhub.io/api/v1/stock/peers?symbol=${symbol}&token=cn11b0hr01quegsk70ngcn11b0hr01quegsk70o0`);
      const peersData = peersResponse.data;
      console.log("peersData: ", peersData);
  
      const recResponse = await axios.get(`https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=cn11b0hr01quegsk70ngcn11b0hr01quegsk70o0`);
      const recData = recResponse.data;
  
      const insiderResponse = await axios.get(`https://finnhub.io/api/v1/stock/insider-sentiment?symbol=${symbol}&from=2022-01-01&token=cn11b0hr01quegsk70ngcn11b0hr01quegsk70o0`);
      const insiderData = insiderResponse.data;
  
      const earningsResponse = await axios.get(`https://finnhub.io/api/v1/stock/earnings?symbol=${symbol}&token=cn11b0hr01quegsk70ngcn11b0hr01quegsk70o0`);
      const earningsData = earningsResponse.data;
  
      const TODAY = new Date();
      const thirtyDaysBack = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - 30);
      const oneDayBack = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - 1);
      const twoYearsBack = new Date(TODAY.getFullYear() - 2, TODAY.getMonth(), TODAY.getDate());
      const fromDate = format(twoYearsBack, 'yyyy-MM-dd');
      const BEFORE_30 = format(thirtyDaysBack, 'yyyy-MM-dd');
      const BEFORE_1 = format(oneDayBack, 'yyyy-MM-dd');
      const toDate = format(TODAY, 'yyyy-MM-dd');
  
      const newsResponse = await axios.get(`https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${BEFORE_30}&to=${toDate}&token=cn11b0hr01quegsk70ngcn11b0hr01quegsk70o0`);
      const newsData = newsResponse.data;
  
      res.json({ companyProfile, autoCompData, quoteData, recData, newsData, insiderData, earningsData, peersData });
  
    } catch (error) {
      console.error('Error fetching company profile:', error.response?.data || error.message);
      res.status(error.response?.status || 500).send(error.response?.data || 'Internal Server Error');
    }
  });

  app.get('/company-autocomp/:ticker', async (request, response) => {
    console.log('Request received for /company-autocomp');
    const symbol = request.params.ticker; // Get the symbol from the query parameter
    
    try {
      const autoCompResponse = await axios.get(`https://finnhub.io/api/v1/search?q=${symbol}&token=cn11b0hr01quegsk70ngcn11b0hr01quegsk70o0`);
      const autoCompData = autoCompResponse.data;
      console.log(autoCompData)
  
      response.json({ autoCompData });
  
    } catch (error) {
      console.error('Error fetching company profile autocomp:', error.response?.data || error.message);
      response.status(error.response?.status || 500).send(error.response?.data || 'Internal Server Error');
    }
  });

  app.get('/company-quote/:ticker', async (request, response) => {
    console.log('Request received for /company-quote');
    const symbol = request.params.ticker; // Get the symbol from the query parameter
    
    try {
      const quoteResponse = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=cn11b0hr01quegsk70ngcn11b0hr01quegsk70o0`);
      const quoteData = quoteResponse.data;
  
      response.json({ quoteData });
  
    } catch (error) {
      console.error('Error fetching company profile:', error.response?.data || error.message);
      response.status(error.response?.status || 500).send(error.response?.data || 'Internal Server Error');
    }
  });

  app.get('/company-peers/:ticker', async (request, response) => {
    console.log('Request received for /company-peers');
    const symbol = request.params.ticker; // Get the symbol from the query parameter
    
    try {
      // Make API call to Finnhub
  
      const peersResponse = await axios.get(`https://finnhub.io/api/v1/stock/peers?symbol=${symbol}&token=cn11b0hr01quegsk70ngcn11b0hr01quegsk70o0`);
      
      const peersData = peersResponse.data;
      console.log("peersData: ", peersData)
  
      response.json({ peersData });
  
      // res.json(companyProfile); // Send the company profile data as JSON response
    } catch (error) {
      console.error('Error fetching company peers:', error.response?.data || error.message);
      response.status(error.response?.status || 500).send(error.response?.data || 'Internal Server Error');
    }
  });
  
  app.get('/company-profile-poly', async (req, res) => {
    console.log('Request received for /company-profile-poly');
    let symbol = req.query.symbol; // Get the symbol from the query parameter
    symbol = symbol.toUpperCase(); 
    
    try {
  
      const TODAY = new Date();
      const thirtyDaysBack = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - 30);
      const oneDayBack = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - 1);
      const twoYearsBack = new Date(TODAY.getFullYear() - 2, TODAY.getMonth(), TODAY.getDate());
      const fromDate = format(twoYearsBack, 'yyyy-MM-dd');
      const BEFORE_30 = format(thirtyDaysBack, 'yyyy-MM-dd');
      const BEFORE_1 = format(oneDayBack, 'yyyy-MM-dd');
      const toDate = format(TODAY, 'yyyy-MM-dd');
  
      console.log('fromDate:', format(fromDate, 'yyyy-MM-dd'));
      console.log('toDate:', format(toDate, 'yyyy-MM-dd'));
  
      const highchartsResponse = await axios.get(`https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${fromDate}/${toDate}?adjusted=true&sort=asc&apiKey=K3aAkNxxIVq84NBHIhk5a82mE0KqnwP_`);
      
      console.log("Highcharts Response:", highchartsResponse.data.results); 
      const highchartsData = highchartsResponse.data.results;
  
      console.log("highchartsData:", highchartsData);
  
      res.json({ highchartsData});
      
    } catch (error) {
      console.error('Error fetching company profile poly:', error.response?.data || error.message);
      res.status(error.response?.status || 500).send(error.response?.data || 'Internal Server Error');
    }
  });

  app.get('/hourly-chart', async (req, res) => {
    console.log('Request received for /hourly-chart');
    let symbol = req.query.symbol; // Get the symbol from the query parameter
    symbol = symbol.toUpperCase();
    
    let hourlyFromDateStr = req.query.fromDate; // Assuming the parameter name is 'fromDate'
    let hourlyToDateStr = req.query.toDate;

    const hourlyFromDate = new Date(hourlyFromDateStr);
    const hourlyToDate = new Date(hourlyToDateStr);

    console.log('Symbol str to date:', symbol);
    console.log('From Date str to date:', hourlyFromDate);
    console.log('To Date str to date:', hourlyToDate);
    
    try {
  
      console.log('Symbol:', symbol);
      console.log('From Date:', hourlyFromDate);
      console.log('To Date:', hourlyToDate);

      const fromDate = format(hourlyFromDate, 'yyyy-MM-dd');
      const toDate = format(hourlyToDate, 'yyyy-MM-dd');
  
      console.log('fromDate:', format(fromDate, 'yyyy-MM-dd'));
      console.log('toDate:', format(toDate, 'yyyy-MM-dd'));
  
      const hourlyChartResponse = await axios.get(`https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/hour/${fromDate}/${toDate}?adjusted=true&sort=asc&apiKey=K3aAkNxxIVq84NBHIhk5a82mE0KqnwP_`);
      console.log("hourlyChartResponse:", hourlyChartResponse.data.results); 
      const hourlyChartData = hourlyChartResponse.data.results;
  
      console.log("hourlyChartData:", hourlyChartData);
  
      res.json({ hourlyChartData});
      
    } catch (error) {
      console.error('Error fetching company hourly chart:', error.response?.data || error.message);
      res.status(error.response?.status || 500).send(error.response?.data || 'Internal Server Error');
    }
  });

// app.get('/', (req, res) => {
//   res.send('Hello from App Engine!');
// });

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist','my-angular-project','browser', 'index.html'));
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});

