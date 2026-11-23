(function (root) {
	'use strict';
	const model = `DIM_REGION:
  type: dataset
  table: TABLE_REGION
  dimension: [region]
  columns:
    region:
    manager:

FACT_SALES:
  type: dataset
  table: TABLE_SALES
  dimension: [id]
  columns:
    id:
    region:
    customer:
    dt_month:
    status:
    amount:
    manager: 'pk(region).{DIM_REGION}.manager'
  measures:
    sales: SUM({amount})
    cnt: COUNT(1)

average_sale:
  type: measure
  formula: 'DIVIDE({sales}, {cnt})'

completed_sales:
  type: measure
  formula: '{sales: {+f: {status: completed}}}'

within_slice_share:
  type: measure
  formula: 'DIVIDE({sales}, {sales: {-d: region}})'

all_region_share:
  type: measure
  formula: 'DIVIDE({sales}, {sales: {-df: region}})'

average_customer_sales:
  type: measure
  formula: 'AVG({sales: {+d: customer}})'

sum_customer_sales:
  type: measure
  formula: 'SUM({sales: {+d: customer}})'

max_customer_sales:
  type: measure
  formula: 'MAX({sales: {+d: customer}})'

previous_sales:
  type: measure
  formula: '{sales: pp}'

sales_change:
  type: measure
  formula: '{sales: pop}'

previous_sales_filled:
  type: measure
  formula: 'ISNULL({sales: pp}, 0)'
`;
	const data = {
		model,
		rows: [
			{id:1,region:'North',customer:'A',dt_month:'2025-02-01',status:'completed',amount:10},
			{id:2,region:'North',customer:'B',dt_month:'2025-02-01',status:'returned',amount:20},
			{id:3,region:'South',customer:'C',dt_month:'2025-02-01',status:'completed',amount:30},
			{id:4,region:'South',customer:'C',dt_month:'2025-02-01',status:'completed',amount:40},
			{id:5,region:'North',customer:'A',dt_month:'2025-01-01',status:'completed',amount:8},
			{id:6,region:'North',customer:'A',dt_month:'2025-01-01',status:'completed',amount:12},
			{id:7,region:'South',customer:'C',dt_month:'2025-01-01',status:'completed',amount:20},
			{id:8,region:'South',customer:'D',dt_month:'2025-01-01',status:'completed',amount:30}
		],
		regions: [{region:'North',manager:'Ada'},{region:'South',manager:'Lin'}],
		quizzes: [
			{"chapter":"identity","question":"Which field does FACT_SALES declare as the key for each source sale?","options":["[region]","[id]","[amount]"],"answer":1,"why":"FACT_SALES declares dimension: [id]. region repeats. amount happens to be unique in these four example rows, but it is not the declared key."},
			{"chapter":"model","question":"Which definition is an atomic measure on FACT_SALES?","options":["sales: SUM({amount})","average_sale: DIVIDE({sales}, {cnt})","GROUP BY region"],"answer":0,"why":"sales aggregates amount from FACT_SALES without referencing another measure. average_sale is composite because it references sales and cnt. GROUP BY sets the report grouping; it does not define a measure."},
			{"chapter":"expressions","question":"For North, sales is 30 and cnt is 2. What does DIVIDE({sales}, {cnt}) return?","options":["25, the average sale amount across both regions","30, North's total sales","15, North's average sale amount"],"answer":2,"why":"For North, sales / cnt = 30 / 2 = 15 per sale. The formula uses North's totals, not the totals across both regions."},
			{"chapter":"grouping","question":"When the report groups by region, what dimension does FACT_SALES still declare?","options":["[region]","[id]","[]"],"answer":1,"why":"GROUP BY region creates one result row per region. FACT_SALES still declares [id] as its source-row key."},
			{"chapter":"compiler","question":"What does compiling the model and query produce in this exercise?","options":["Report rows checked against the database","Generated SQL to inspect","Proof that every source key is unique"],"answer":1,"why":"Compilation generates SQL; it does not execute the report or check source-key uniqueness. Those checks require a database connection."},
			{"chapter":"filters","question":"In February, why can North show sales = 30 and completed_sales = 10?","options":["+f limits completed_sales to completed sales; sales still includes both transactions","The report's WHERE removes the returned sale from every measure","completed_sales changes the dataset key"],"answer":0,"why":"completed_sales applies +f: status = completed to its own inputs, giving 10. sales still includes both North transactions, giving 30. A report-level status filter would affect both measures."},
			{"chapter":"shares","question":"For a February report filtered to North, which denominator includes both regions' sales?","options":["{sales: {-d: region}}","{sales: {-df: region}}","{sales}"],"answer":1,"why":"For this denominator, -df removes region grouping and region-related filters, giving 100. -d keeps the North filter, giving 30. Both keep the February filter."},
			{"chapter":"grain","question":"South has two sales of 30 and 40, both for customer C. What is South's average sales per customer?","options":["35","70","2"],"answer":1,"why":"Customer C's total is 30 + 40 = 70. South has one customer, so its average per customer is 70. Averaging the two sale amounts would give 35."},
			{"chapter":"time","question":"For February 2025 in this monthly report, which period does {sales: pp} use?","options":["January 2025","February 2024","All earlier months combined"],"answer":0,"why":"With a monthly time context, pp requests January 2025's sales value. pop calculates the growth rate instead."},
			{"chapter":"lookups","question":"If TABLE_REGION has two North rows, what can happen when sales are joined to the directory?","options":["The compiler automatically deduplicates the table","Each North sale can appear twice in the joined result","Nothing; the declared dimension does not affect lookups"],"answer":1,"why":"Each North sale matches two directory rows, so it appears twice in the joined result and can be counted twice. The source sales rows are unchanged. With a database connection, --validate-only reports DIMENSION_NOT_UNIQUE for DIM_REGION."},
			{"chapter":"missing","question":"In the January report, what changes when ISNULL({sales: pp}, 0) replaces {sales: pp}?","options":["Extra December rows appear","The previous-sales value shows 0 instead of NULL in each region's row","The source history now proves December sales were zero"],"answer":1,"why":"ISNULL replaces the missing previous-sales value with 0 in each existing January result row. It adds no rows and does not establish that December sales were zero."}
		],
		queries: {
			filters: "SELECT region, AGG(sales), AGG(completed_sales)\nFROM MODEL\nWHERE dt_month = '2025-02-01'\nGROUP BY region",
			filters_north: "SELECT region, AGG(sales), AGG(completed_sales)\nFROM MODEL\nWHERE dt_month = '2025-02-01' AND region = 'North'\nGROUP BY region",
			shares: "SELECT region, AGG(sales), AGG(within_slice_share), AGG(all_region_share)\nFROM MODEL\nWHERE dt_month = '2025-02-01' AND region = 'North'\nGROUP BY region",
			grain_avg: "SELECT region, AGG(average_sale), AGG(average_customer_sales)\nFROM MODEL\nWHERE dt_month = '2025-02-01'\nGROUP BY region",
			grain_sum: "SELECT region, AGG(sum_customer_sales)\nFROM MODEL\nWHERE dt_month = '2025-02-01'\nGROUP BY region",
			grain_max: "SELECT region, AGG(max_customer_sales)\nFROM MODEL\nWHERE dt_month = '2025-02-01'\nGROUP BY region",
			time: "SELECT region, dt_month, AGG(sales), AGG(previous_sales), AGG(sales_change)\nFROM MODEL\nWHERE dt_month = '2025-02-01'\nGROUP BY region, dt_month",
			time_january: "SELECT region, dt_month, AGG(sales), AGG(previous_sales), AGG(sales_change)\nFROM MODEL\nWHERE dt_month = '2025-01-01'\nGROUP BY region, dt_month",
			lookup: "SELECT manager, AGG(sales)\nFROM MODEL\nWHERE dt_month = '2025-02-01'\nGROUP BY manager",
			missing: "SELECT region, dt_month, AGG(sales), AGG(previous_sales_filled)\nFROM MODEL\nWHERE dt_month = '2025-01-01'\nGROUP BY region, dt_month",
			capstone: "SELECT region, AGG(sales), AGG(completed_sales), AGG(previous_sales), AGG(average_customer_sales), AGG(all_region_share)\nFROM MODEL\nWHERE dt_month = '2025-02-01'\nGROUP BY region"
		}
	};
	if (typeof module === 'object' && module.exports) module.exports = data;
	else root.SmallJourneyCourse = data;
})(typeof globalThis !== 'undefined' ? globalThis : this);
