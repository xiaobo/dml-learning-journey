(function (root) {
	'use strict';
	const model = `regions:
  type: dataset
  table: DIM_REGION
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
    manager: 'pk(region).{regions}.manager'
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
			{chapter:'identity',question:'Which declared source key identifies each sale in this model?',options:['[region]','[id]','[amount]'],answer:1,why:'The model declares [id] as source identity. Region repeats. Amount happens to be unique in these four rows, but it is not the declared key.'},
			{chapter:'model',question:'Which definition is an atomic measure on FACT_SALES?',options:['sales: SUM({amount})',"average_sale: DIVIDE({sales}, {cnt})",'GROUP BY region'],answer:0,why:'sales is bound to FACT_SALES and aggregates amount without referencing measures. average_sale is composite because it references sales and cnt, even though both use FACT_SALES. GROUP BY controls query grouping.'},
			{chapter:'expressions',question:'For North, sales is 30 and cnt is 2. What does DIVIDE({sales}, {cnt}) return?',options:['25, the average across all four sales','30, the total for North','15, the average for North'],answer:2,why:'The formula uses measures in the current report context. North gives 30 / 2 = 15. All four sales give 100 / 4 = 25.'},
			{chapter:'grouping',question:'After grouping by region, what is the source dataset dimension?',options:['[region]','[id]','[]'],answer:1,why:'Query grouping changes the result grain. It does not change the source-row identity [id].'},
			{chapter:'compiler',question:'What does a successful compile produce in this exercise?',options:['Verified database result rows','Generated SQL to inspect','Proof that every source key is unique'],answer:1,why:'Compilation produces SQL. Live validation and result comparison need a database and separate evidence.'},
			{chapter:'filters',question:'In February, why can North show sales = 30 and completed_sales = 10?',options:['+f filters the completed_sales inputs; the other measure still uses both sales','A report WHERE removes the returned sale from every measure','completed_sales changes the dataset key'],answer:0,why:'The completed_sales definition applies +f to that measure. A report-level status WHERE would also change sales.'},
			{chapter:'shares',question:'For a North-only report, which denominator keeps sales from all regions?',options:['{sales: {-d: region}}','{sales: {-df: region}}','{sales}'],answer:1,why:'-df removes region grouping and its related filter for that reference. -d retains the region filter.'},
			{chapter:'grain',question:'South has two sales, 30 and 40, both for customer C. What is its average customer sales?',options:['35','70','2'],answer:1,why:'First sum sales per customer: C = 70. Then average the one customer total. Averaging the two source transactions would give 35.'},
			{chapter:'time',question:'At February month grain, what period does pp request?',options:['January 2025','February 2024','All earlier months combined'],answer:0,why:'pp requests the previous period at the active month grain. It is a value, not a growth rate.'},
			{chapter:'lookups',question:'What changes if DIM_REGION contains two rows for North?',options:['The compiler automatically deduplicates the table','The lookup can duplicate matching fact rows','Nothing, because dimension is only documentation'],answer:1,why:'The declared key must match source uniqueness. Duplicate lookup targets can multiply matching rows and their amounts. On a database connection, --validate-only detects the non-unique regions dimension and reports DIMENSION_NOT_UNIQUE.'},
			{chapter:'missing',question:'After filling missing previous sales with 0, what changes in January?',options:['Extra December rows appear','The two existing region rows show 0 instead of NULL','The source history now proves December sales were zero'],answer:1,why:'The literal fallback supplies 0 where the previous-sales measure has no value. The two January groups remain. No December rows or source facts are added.'}
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
