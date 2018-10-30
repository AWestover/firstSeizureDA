/* matrix */

// model parameters
let pAE = 0.22; // risk of AED side affects
let Efficacy = 0.75; // constant
let baseCase = 1;
let x = [1-pAE,0,pAE,0,0]; // initial probabilities
let probabilities = [];
let utilities = [];

// must input base case for recurrence risks
function transition_matrix(pt_data, t) {
	let year = t+pt_data.age;
	if (year >= muASR.length) {
		year = muASR.length - 1;
	}

	let da = 1-math.exp(-muASR[year]);
	let temp = math.exp(muASR[year])-1;
	let db = pt_data.MR*temp / (1+pt_data.MR*temp);

	let d1  = da;
	let a21 = pt_data.recurrence_risk[year] * Efficacy;
	let a11 = 1-d1-a21;

	let d2  = db;
	let a22 = 1-d2;

	let d3  = da;
	let a43 = pt_data.recurrence_risk[year] * Efficacy;
	let a33 = 1-d3-a43;

	let d4  = db;
	let a44 = 1-d4;

	let x = math.matrix([
		[a11,0  ,0  ,0  ,0  ],
		[a21,a22,0  ,0  ,0  ],
		[0  ,0  ,a33,0  ,0  ],
		[0  ,0  ,a43,a44,0  ],
		[d1 ,d2 ,d3 ,d4 ,1  ]
	]);
	return (x);
}

function calculateUtility(state) {
	let weights = [0.967, 0.757, 0.8647, 0.6757, 0];
	let utility = 0;
	for (let i = 0; i < state.length; i++)
	{
		utility += state[i]*weights[i];
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
	for (let i = 1; i < 100; i++) {
		probabilities.push(x);
		x = math.multiply(transition_matrix(pt_data, i),x).toArray();
		utilities.push(calculateUtility(x));
	}

	let totalUtility = 0;
	for (let i = 0; i < utilities.length; i++)
	{
		totalUtility += utilities[i];
	}
	$("#totalUtility").text("Total Utility: "+totalUtility.toFixed(2));

	let new_order = [4,3,1,2,0];
	let curvesY = [];
	for (let i = 0; i < probabilities[0].length; i++) {
		curvesY.push([]);
		if (i == 0)
		{
			for (let j = 0; j < probabilities.length; j++)
			{
				curvesY[0].push(probabilities[j][new_order[i]]);
			}
		}
		else {
			for (let j = 0; j < probabilities.length; j++)
			{
				curvesY[i].push(probabilities[j][new_order[i]]+curvesY[i-1][j]);
			}
		}
	}

	let colors = ['#08519c','#3182bd','#6baed6','#bdd7e7','#eff3ff']
	let data = [];
	for (let i = 0; i < curvesY.length; i++)
	{
		let cTrace = {
			y: curvesY[i],
			mode: 'line',
			fill: 'tonexty',
			fillcolor: colors[i],
			stroke: '#00000', //????
			name: '#'+i
		}
		data.push(cTrace);
	}

	let layout = {
		title: 'prob', 
		xaxis: {
			title: 'Years'
		},
		yaxis: {
			title: 'probabilities'
		}
	};

	Plotly.newPlot('div1', data, layout);
}

