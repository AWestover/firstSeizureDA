/* matrix */

let models = ["model 1", "model 2"];
// model parameters
let pAE = 0.22; // risk of AED side affects
let Efficacy = {
	"model 1": 0.75,
	"model 2": 1.00
};
let baseCase = 1;

// must input base case for recurrence risks
function transition_matrix(pt_data, t, model) {
	let year = t+pt_data.age;
	if (year >= muASR.length) {
		year = muASR.length - 1;
	}
	let out;
	if (model == 'model 1')
	{
		let da = 1-math.exp(-muASR[year]);
		let temp = math.exp(muASR[year])-1;
		let db = pt_data.MR*temp / (1+pt_data.MR*temp);

		let d1  = da;
		let a21 = (1-d1)*pt_data.recurrence_risk[year] * Efficacy[model];
		let a11 = 1-d1-a21;

		let d2  = db;
		let a22 = 1-d2;

		let d3  = da;
		let a43 = (1-d3)*pt_data.recurrence_risk[year] * Efficacy[model];
		let a33 = 1-d3-a43;

		let d4  = db;
		let a44 = 1-d4;

		out = math.matrix([
			[a11,0  ,0  ,0  ,0  ],
			[a21,a22,0  ,0  ,0  ],
			[0  ,0  ,a33,0  ,0  ],
			[0  ,0  ,a43,a44,0  ],
			[d1 ,d2 ,d3 ,d4 ,1  ]
		]);
	}
	else if (model == 'model 2')
	{
		let da = 1-math.exp(-muASR[year]);
		let temp = math.exp(muASR[year])-1;
		let db = pt_data.MR*temp / (1+pt_data.MR*temp);

		let d1  = da;
		let a21 = (1-d1)*pt_data.recurrence_risk[year] * Efficacy[model];
		let a11 = 1-d1-a21;

		let d2  = db;
		let a22 = 1-d2;

		let d3  = da;
		let a43 = (1-d3)*pt_data.recurrence_risk[year] * Efficacy[model];
		let a33 = 1-d3-a43;

		let d4  = db;
		let a44 = 1-d4;

		out = math.matrix([
			[a11,0  ,0  ,0  ,0  ],
			[a21*(1-pAE),a22,0  ,0  ,0  ],
			[0  ,0  ,a33,0  ,0  ],
			[a21*pAE  ,0  ,a43,a44,0  ],
			[d1 ,d2 ,d3 ,d4 ,1  ]
		]);
	}
	return (out);
}

function calculateUtility(state, model) {
	let weights = {
		"model 1": [0.967, 0.757, 0.8647, 0.6757, 0],
		"model 2": [1, 0.757, 0.8647, 0.6757, 0]
	}
	let utility = 0;
	for (let i = 0; i < state.length; i++)
	{
		utility += state[i]*weights[model][i];
	}
	return utility;
}

function runProcess() {
	let temp;

	let age = 30;
	temp = parseInt($("#Age").val());
	if (temp) {
		age = temp;
	}
	let MR = 5.4;
	temp = parseInt($("#MR").val());
	if (temp) {
		age = temp;
	}

	let pt_data = {
		"age": age,
		"MR": MR // mortality risk of seizures
	};

	let baseCase = 1;
	temp = parseInt($("#baseCase").val());
	if (temp && (temp == 1 || temp == 2 || temp == 3)) {
		baseCase = temp;
	}

	let recRisk = [];
	if (baseCase == 1) {
		for (let i = 0; i < 500; i++) {
			if (i-age < 0)
				recRisk.push(1);
			else if (i-age >= 0 && i-age < 2)
				recRisk.push(21.9/100);
			else if (i-age >= 2 && i-age < 5)
				recRisk.push(7.04/100);
			else if (i-age >= 5 && i-age < 8)
				recRisk.push(0.68/100);
			else
				recRisk.push(0.01/100);
		}
    }
	else { //baseCase ==2 | baseCase==3;
	    for (let i = 0; i < 500; i++) {
			if (i-age < 0)
				recRisk.push(1);
			else if (i-age >= 0 && i-age < 2)
				recRisk.push(65.7/100);
			else if (i-age >= 2 && i-age < 5)
				recRisk.push(21.12/100);
			else if (i-age >= 5 && i-age < 8)
				recRisk.push(4.08/100);
			else
				recRisk.push(0.03/100);
		}
	}
	pt_data["recurrence_risk"] = recRisk;

	calculations(pt_data);
}

function calculations(pt_data) {
	let x = { // initial probabilities
		"model 1": [1-pAE,0,pAE,0,0],
		"model 2":[1,0,0,0,0]
	};
	let probabilities = {
		"model 1": [],
		"model 2": []
	};
	let utilities = {
		"model 1": [],
		"model 2": []
	};
	for (let m in models)
	{
		for (let i = 1; i < 100; i++) {
			probabilities[models[m]].push(x[models[m]]);
			x[models[m]] = math.multiply(transition_matrix(pt_data, i, models[m]),x[models[m]]).toArray();
			utilities[models[m]].push(calculateUtility(x[models[m]], models[m]));
		}
	}

	let totalUtility = {"model 1": 0, "model 2": 0};
	for (let m in models) {
	{
		for (let i = 0; i < utilities[models[m]].length; i++)
			totalUtility[models[m]] += utilities[models[m]][i];
		}
	}
	console.log(totalUtility);
	$("#totalUtility1").text("Total Utility: "+totalUtility["model 1"].toFixed(2));
	$("#totalUtility2").text("Total Utility: "+totalUtility["model 2"].toFixed(2));

	if(totalUtility["model 1"] > totalUtility["model 2"])
	{
		$("#recommended").text("recommended: model 1");
	}
	else {
		$("#recommended").text("recommended: model 2");
	}

	let new_order = [4,3,1,2,0];
	let curvesY = {"model 1": [], "model 2": []};
	for (let m in models)
	{
		for (let i = 0; i < probabilities[models[m]][0].length; i++) {
			curvesY[models[m]].push([]);
			if (i == 0)
			{
				for (let j = 0; j < probabilities[models[m]].length; j++)
				{
					curvesY[models[m]][0].push(probabilities[models[m]][j][new_order[i]]);
				}
			}
			else {
				for (let j = 0; j < probabilities[models[m]].length; j++)
				{
					curvesY[models[m]][i].push(probabilities[models[m]][j][new_order[i]]+curvesY[models[m]][i-1][j]);
				}
			}
		}
	}

	let colors = {
		"model 1": ['#08519c','#3182bd','#6baed6','#bdd7e7','#eff3ff'],
		"model 2": ['#08519c','#3182bd','#6baed6','#bdd7e7','#ffffff']
	};
	let data = {"model 1": [], "model 2": []};
	for (let m in models)
	{
		for (let i = 0; i < curvesY[models[m]].length; i++)
		{
			let cTrace = {
				y: curvesY[models[m]][i],
				mode: 'none',
				fill: 'tonexty',
				fillcolor: colors[models[m]][i],
				name: '#'+i
			}
			data[models[m]].push(cTrace);
		}
	}

	let layout = {
		title: 'probabilities',
		xaxis: {
			title: 'Years'
		},
		yaxis: {
			title: 'probabilities'
		},
		margin: {
			l: 50,
			r: 30,
			b: 30,
			t: 30
		}
	};

	Plotly.newPlot('graph1', data["model 1"], layout);
	Plotly.newPlot('graph2', data["model 2"], layout);
}

runProcess();
