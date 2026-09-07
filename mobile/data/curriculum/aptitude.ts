import { q, type SectionDraft } from './authoring';

export const aptitude: readonly SectionDraft[] = [
  {
    title: 'Percentages', skillId: 'quantitative_aptitude',
    concepts: ['Percent means per hundred: p% of x is x × p/100.', 'A percentage is a rate; its actual amount depends on the base.', 'After a discount of p%, the payable fraction is (100-p)/100.'],
    example: ['A 600-rupee book has a 15% discount. Find its sale price.', 'Discount = 600 × 15/100 = 90 rupees.', 'Subtract the discount: 600 - 90 = 510 rupees.', 'Check: the customer pays 85% of 600, also 510.'],
    quiz: [
      q('Which expression finds 12% of 250?', '250 × 12/100', '250 / 12', '250 - 12', 'Convert 12% into 12/100, then multiply by the base 250.', 'Percentages are fractions with denominator 100.', 'Dividing by 12 does not represent twelve per hundred.', 'Subtracting 12 removes a fixed quantity, not a percentage.'),
      q('After a 30% discount, what fraction of the original price is paid?', '0.70', '0.30', '1.30', 'The remaining percentage is 100 - 30 = 70%, or 0.70.', 'Find the percentage left after the discount.', '0.30 is the discounted fraction, not the payable fraction.', '1.30 represents a 30% increase.'),
      q('What is 18% of 350?', '63', '53', '287', '350 × 18/100 = 3.5 × 18 = 63.', 'Find 10% and 8%, then add them.', '10% is 35 and 8% is 28; their sum is 63, not 53.', '287 is the amount remaining after subtracting 18%, not the 18% part.'),
    ],
  },
  {
    title: 'Ratios and proportions', skillId: 'quantitative_aptitude',
    concepts: ['A ratio compares quantities using equal-sized parts.', 'For a:b, the combined quantity contains a+b parts; divide the total by that number.', 'Scale both sides by the same factor to preserve a ratio.'],
    example: ['Split 640 rupees in the ratio 3:5.', 'Total parts = 3 + 5 = 8.', 'Each part is worth 640/8 = 80 rupees.', 'Shares are 3 × 80 = 240 and 5 × 80 = 400; they sum to 640.'],
    quiz: [
      q('A total is split 2:7. Which fraction belongs to the smaller share?', '2/9', '2/7', '7/9', 'The whole contains 2+7=9 parts, of which the smaller share has 2.', 'Use total parts in the denominator.', '2/7 compares the smaller share with the larger share, not the whole.', '7/9 is the larger share.'),
      q('A:B = 3:4 and B:C = 2:5. How should the ratios be aligned?', 'Rewrite B:C as 4:10', 'Rewrite B:C as 2:10', 'Add the B terms to get 6', 'Multiply both terms of 2:5 by 2 so B is 4 in both comparisons.', 'The shared quantity must have the same number of parts.', 'Scaling only C changes the ratio.', 'Adding the B terms does not make the two comparisons consistent.'),
      q('Divide 840 in the ratio 3:4. What is the larger share?', '480', '360', '630', 'Seven parts make 840, so one part is 120 and four parts are 480.', 'Find one part before multiplying.', '360 is the smaller share of three parts.', '630 is 3/4 of 840; 3:4 uses seven total parts.'),
    ],
  },
  {
    title: 'Averages and weighted averages', skillId: 'quantitative_aptitude',
    concepts: ['Average = total/count, so total = average × count.', 'When groups have different sizes, weight each average by its group size.', 'An added observation changes both the numerator and denominator.'],
    example: ['Ten students average 60 marks and twenty average 75. Find the combined average.', 'Group totals are 10 × 60 = 600 and 20 × 75 = 1500.', 'Combined total = 2100 across 30 students.', 'Combined average = 2100/30 = 70 marks.'],
    quiz: [
      q('Two groups have sizes 4 and 6, and averages 10 and 20. Which expression gives their combined average?', '(4×10 + 6×20)/10', '(10+20)/2', '(4+6)/(10+20)', 'Multiply each average by its count, add totals, then divide by the combined count.', 'Reconstruct the two totals.', 'A simple average gives both groups equal weight despite unequal sizes.', 'This divides counts by averages and has the wrong meaning.'),
      q('Five values average 12. A sixth value of 18 is added. What must change?', 'Total becomes 78 and count becomes 6', 'Total becomes 30 and count becomes 6', 'Total stays 60 and count becomes 6', 'The original total is 5×12=60. Adding 18 gives 78 over six values.', 'An average is not the original total.', '30 adds the old average to the new value instead of using the old total.', 'The new observation must also be added to the total.'),
      q('Eight students average 15 marks. Two more score 20 each. What is the new average?', '16', '17.5', '20', 'Old total 8×15=120; new total 160; new count 10; average 16.', 'Use the total marks across all ten students.', '17.5 averages the two group averages without weighting their sizes.', '20 is the average of the new students only.'),
    ],
  },
  {
    title: 'Profit, loss, and successive discounts', skillId: 'quantitative_aptitude',
    concepts: ['Profit percentage uses cost price as the base, while a discount uses marked price.', 'Successive percentage changes multiply their remaining factors.', 'A 20% discount followed by 10% leaves 0.8×0.9=0.72 of the original price.'],
    example: ['An item costs 500 and is marked at 800. Apply discounts of 20% then 10%. Find profit percentage.', 'After the first discount: 800×0.8=640.', 'After the second discount: 640×0.9=576.', 'Profit = 576-500=76; profit percentage = 76/500×100=15.2%.'],
    quiz: [
      q('Why do discounts of 20% then 10% not equal a 30% discount?', 'The second discount uses the reduced price', 'Discount percentages cannot be multiplied', 'The second discount uses cost price', 'The two reductions act on different bases; 0.8×0.9 leaves 72%, a 28% total discount.', 'Identify the base for the second reduction.', 'Remaining-price factors can and should be multiplied.', 'A successive discount uses the current selling price, not cost price.'),
      q('An item costs 400 and sells for 500. Which denominator gives profit percentage?', '400', '500', '100', 'Profit is 100; profit percentage is 100/400×100=25%, using cost as the base.', 'Profit is measured relative to the investment.', 'Using selling price gives profit margin, a different measure.', '100 is the profit amount, not the base.'),
      q('A marked price of 1000 receives discounts of 10% and then 20%. What is paid?', '720', '700', '800', '1000×0.9×0.8=720.', 'Apply each discount to the price remaining.', '700 incorrectly adds the discounts to 30%.', '800 applies only the 20% discount.'),
    ],
  },
  {
    title: 'Time and work', skillId: 'quantitative_aptitude',
    concepts: ['If a worker finishes a job in d days, their constant rate is 1/d job per day.', 'Independent simultaneous work rates add; completion times do not.', 'For partial work, multiply the combined rate by elapsed time and subtract from one whole job.'],
    example: ['A finishes in 6 days and B in 12 days. How long together?', 'A works at 1/6 and B at 1/12 job per day.', 'Combined rate = 2/12 + 1/12 = 1/4.', 'Time for one job = 1/(1/4) = 4 days.'],
    quiz: [
      q('A takes 10 days and B takes 15. What should be added to find their joint rate?', '1/10 + 1/15', '10 + 15', '(10+15)/2', 'Rates measure work per day; their sum is 1/6 job per day.', 'Convert each completion time into work per day.', 'Adding days does not describe simultaneous work.', 'Averaging completion times ignores additive work rates.'),
      q('A team completes 1/5 of a job daily. After 2 days, which expression gives remaining work?', '1 - 2/5', '1 - 1/5', '2 × 5', 'Two days complete 2/5, leaving 3/5 of the job.', 'Multiply daily rate by elapsed days first.', 'This subtracts only one day of work.', 'This multiplies days by completion time rather than work rate.'),
      q('A finishes in 12 days and B in 18 days. How long together at constant rates?', '7.2 days', '15 days', '30 days', '1/12+1/18=5/36, so time=36/5=7.2 days.', 'Use a common denominator of 36.', '15 is the average of the two times, not the joint completion time.', '30 adds the times as if they work sequentially on separate jobs.'),
    ],
  },
  {
    title: 'Relative speed', skillId: 'quantitative_aptitude',
    concepts: ['Distance = speed × time; first make units consistent.', 'Approaching objects close the gap at the sum of speeds; same-direction pursuit uses the difference.', 'A train passing a pole travels its own length; passing a platform travels train length plus platform length.'],
    example: ['A 120 m train travels at 54 km/h. How long to cross a 180 m platform?', 'Convert speed: 54×5/18=15 m/s.', 'The train front travels 120+180=300 m until its rear clears the platform.', 'Time = 300/15=20 seconds.'],
    quiz: [
      q('Two cars approach each other at 40 and 60 km/h. What is their closing speed?', '100 km/h', '20 km/h', '50 km/h', 'Both cars reduce the gap, so their speeds add.', 'Ask how much of the gap disappears in one hour.', 'The difference applies to pursuit in the same direction.', 'The average is not the rate at which the gap closes.'),
      q('A train fully passes a stationary platform. Which distance is used?', 'Train length + platform length', 'Platform length only', 'Train length only', 'The rear must move past the platform end, requiring both lengths.', 'Track the train front from entry until the rear exits.', 'This stops when the front reaches the platform end.', 'This is the distance for passing a pole, not a platform.'),
      q('A 150 m train at 72 km/h passes a pole. How many seconds?', '7.5', '2.0833', '15', '72 km/h = 20 m/s. Time = 150/20 = 7.5 seconds.', 'Convert km/h to m/s by multiplying by 5/18.', 'Dividing metres by km/h mixes units.', '15 seconds would correspond to only 10 m/s.'),
    ],
  },
  {
    title: 'Simple and compound interest', skillId: 'quantitative_aptitude',
    concepts: ['Simple interest is P×r×t/100 with annual percentage rate r and years t.', 'Annual compound amount is P(1+r/100)^t because each year includes earlier interest.', 'Interest is amount minus principal; do not confuse the two.'],
    example: ['Invest 2000 at 10% annually for two years. Compare simple and compound interest.', 'Simple interest = 2000×10×2/100=400.', 'Compound amount = 2000×1.1×1.1=2420.', 'Compound interest = 420, which exceeds simple interest by 20.'],
    quiz: [
      q('What is the second-year interest base under annual compounding?', 'Principal plus first-year interest', 'Original principal only', 'First-year interest only', 'Unwithdrawn interest joins the principal for the next period.', 'What balance is present at the start of year two?', 'A fixed original base describes simple interest.', 'Interest is charged on the whole balance, not just the previous interest.'),
      q('For principal P and annual rate r%, which expression is the amount after two years?', 'P(1+r/100)^2', 'P(r/100)^2', 'P + 2r', 'Each year multiplies the balance by 1+r/100.', 'The multiplier must retain the starting principal.', 'This omits the principal portion of each annual multiplier.', 'A rate cannot be added directly as a money amount.'),
      q('What is compound interest on 1000 at 10% annually for two years?', '210', '200', '1210', 'Amount=1000×1.1²=1210; subtract principal to get interest 210.', 'Find the amount, then subtract 1000.', '200 is simple interest for two years.', '1210 is the final amount, not the interest.'),
    ],
  },
  {
    title: 'Remainders and cycles', skillId: 'quantitative_aptitude',
    concepts: ['Write an integer as divisor×quotient+remainder, with remainder from 0 to divisor-1.', 'Reduce operands before addition or multiplication, then reduce the result again.', 'Powers often repeat modulo a divisor; use the exponent position within the cycle.'],
    example: ['Find the remainder when 7^23 is divided by 10.', 'Powers of 7 end in 7, 9, 3, 1 and then repeat.', 'The cycle length is 4 and 23 leaves remainder 3 on division by 4.', 'Use the third cycle entry: remainder 3.'],
    quiz: [
      q('If a ≡ 3 and b ≡ 4 modulo 5, how do you find the remainder of ab?', '(3×4) mod 5', '(3+4) mod 5', '3×4 without reducing', 'Products of congruent residues remain congruent; 12 mod 5=2.', 'Keep the operation from the original expression.', 'Adding residues solves a+b, not ab.', 'A remainder modulo 5 must be less than 5.'),
      q('A last-digit cycle has length 4. Exponent 20 has remainder 0 modulo 4. Which entry is used?', 'The fourth entry', 'The first entry', 'No entry; the last digit is zero', 'Multiples of four complete a full cycle, landing on its fourth position.', 'Cycles are indexed by positive exponents starting at 1.', 'The first entry corresponds to remainder 1.', 'A zero exponent remainder is not the numerical result.'),
      q('What is the remainder of 3^10 when divided by 7?', '4', '2', '1', '3^6≡1 mod 7, so 3^10≡3^4=81≡4.', 'The residues of powers of 3 repeat every six exponents.', '2 is the remainder of 3², but exponent 10 is congruent to 4 modulo 6.', '1 corresponds to exponents divisible by 6.'),
    ],
  },
  {
    title: 'Permutations and combinations', skillId: 'quantitative_aptitude',
    concepts: ['Use permutations when order or roles matter, and combinations when only membership matters.', 'nPr = n!/(n-r)!; nCr = n!/[r!(n-r)!].', 'For distinct objects chosen without replacement, the number of choices decreases after each selection.'],
    example: ['Choose a captain and vice-captain from 6 students.', 'The captain has 6 possible choices.', 'The vice-captain has 5 remaining choices.', 'There are 6×5=30 ordered assignments; choosing an unordered pair would give only 15.'],
    quiz: [
      q('Which operation counts a three-person committee from eight students with no roles?', '8 choose 3', '8 permute 3', '8^3', 'A committee is unchanged when its members are reordered, so use combinations.', 'Does swapping two selected people create a new outcome?', 'Permutations count each committee in all six internal orders.', '8^3 allows repeats and treats selection order as significant.'),
      q('Why divide nPr by r! to obtain nCr?', 'Each chosen group appears in r! orders', 'There are r! unchosen groups', 'Every object was selected r! times', 'Each unordered r-element set produces exactly r! distinct orderings.', 'Fix one selected group and count its arrangements.', 'r! counts arrangements of the selected objects, not unchosen groups.', 'The correction applies to whole arrangements, not the frequency of one object.'),
      q('How many three-person committees can be chosen from seven people?', '35', '210', '343', '7C3=7×6×5/(3×2×1)=35.', 'Remove ordering from the three selections.', '210 counts ordered selections.', '343 permits repeats and counts ordered triples.'),
    ],
  },
  {
    title: 'Probability without replacement', skillId: 'quantitative_aptitude',
    concepts: ['For equally likely outcomes, probability is favourable outcomes divided by total outcomes.', 'Without replacement, both the pool and relevant counts change after a draw.', 'Multiply conditional probabilities along one sequence; add probabilities of disjoint sequences.'],
    example: ['A bag contains 3 red and 2 blue balls. Find the probability that two draws without replacement are both red.', 'First red probability is 3/5.', 'After a red is removed, two red remain among four balls: 2/4.', 'Multiply: (3/5)(2/4)=3/10.'],
    quiz: [
      q('After drawing a red from a bag with 4 red and 3 blue, without replacement, what is P(next red)?', '3/6', '4/7', '3/7', 'One red and one total ball have been removed, leaving 3 red among 6.', 'Update numerator and denominator.', '4/7 would apply if the first ball were replaced.', 'The total number of balls must also decrease.'),
      q('Which expression gives P(at least one success) over a specified experiment?', '1 - P(no successes)', '1 - P(exactly one success)', 'P(success on the first trial)', 'The complement of at least one is none.', 'Identify the event that excludes all successes.', 'The complement of exactly one also includes two or more successes.', 'Later trials can succeed even when the first fails.'),
      q('A bag has 3 red and 2 blue balls. What is P(one of each in two draws without replacement)?', '3/5', '3/10', '6/25', 'RB has probability (3/5)(2/4)=3/10; BR also has 3/10. Add to obtain 3/5.', 'Count both colour orders.', '3/10 counts only one order.', '6/25 uses replacement probabilities and only one order.'),
    ],
  },
  {
    title: 'Data interpretation', skillId: 'quantitative_aptitude',
    concepts: ['Read units, denominators, and time periods before comparing table entries.', 'Percentage growth uses the earlier value as its base; percentage-point change subtracts two percentages.', 'An aggregate conversion rate is total conversions divided by total opportunities, not necessarily the average of row rates.'],
    example: ['Team A converts 30 of 100 leads; B converts 80 of 200. Find overall conversion.', 'A has a 30% rate and B a 40% rate.', 'Combined conversions=110 and combined leads=300.', 'Overall rate=110/300×100=36.67% approximately, not 35%.'],
    quiz: [
      q('Sales rise from 80 to 100 units. Which calculation gives percentage growth?', '(100-80)/80 × 100', '(100-80)/100 × 100', '100/80 × 100', 'Growth is the increase relative to the starting value, giving 25%.', 'Use the earlier value as the base.', 'This measures the increase as a fraction of the final value.', '125% describes final sales relative to initial sales, not the increase.'),
      q('A success rate rises from 40% to 50%. What is the percentage-point increase?', '10 percentage points', '25 percentage points', '90 percentage points', 'Percentage points are the direct difference, 50-40=10.', 'Separate a rate difference from relative growth.', '25% is the relative growth in the rate, not the point difference.', 'Adding rates does not measure their change.'),
      q('A sells 120 of 200 units and B sells 180 of 300. What fraction of their combined stock is sold?', '60%', '50%', '120%', 'Total sold=300, total stock=500; 300/500=60%.', 'Combine numerators and denominators separately.', 'Half the stock would be 250 units; 300 were sold.', 'Adding the two 60% rates double-counts the percentage base.'),
    ],
  },
  {
    title: 'Sets and inclusion–exclusion', skillId: 'quantitative_aptitude',
    concepts: ['For two sets, |A∪B|=|A|+|B|-|A∩B| because the overlap was counted twice.', 'For three sets, subtract all pairwise intersections and add back the triple intersection.', 'Pairwise intersection counts normally include people in all three sets; read the question carefully.'],
    example: ['Among 100 students, 60 know C++, 50 know Python, and 30 know both. How many know neither?', 'Union=60+50-30=80.', 'The overlap is subtracted once to count each student once.', 'Neither=100-80=20.'],
    quiz: [
      q('Why is the overlap subtracted in |A|+|B|-|A∩B|?', 'Its members were counted twice', 'Its members belong to neither set', 'The sets must have equal sizes', 'Each overlap member appears once in A and once in B; subtract one extra count.', 'Track one person who belongs to both sets.', 'Overlap means belonging to both, the opposite of neither.', 'The formula works for unequal set sizes.'),
      q('After subtracting all pairwise overlaps for three sets, why add the triple overlap?', 'Triple members have net count zero and need one count', 'Triple members should be counted three times', 'Pairwise overlaps exclude triple members by definition', 'A triple member was added three times and subtracted three times; add it once.', 'Compute 3 additions minus 3 subtractions.', 'A union counts each distinct member once.', 'Standard pairwise intersections include triple members.'),
      q('In a class of 80, 45 study A, 35 study B, and 20 study both. How many study neither?', '20', '0', '60', 'Union=45+35-20=60; neither=80-60=20.', 'Subtract the union from class size.', 'Adding 45+35 without correcting overlap overcounts the union.', '60 is the number studying at least one subject.'),
    ],
  },
  {
    title: 'Logical deductions and arrangements', skillId: 'logical_reasoning',
    concepts: ['Translate each statement into an explicit constraint before choosing an answer.', 'An implication A→B does not imply its converse B→A.', 'A conclusion is necessary only if it holds in every arrangement satisfying all constraints; one valid counterexample disproves necessity.'],
    example: ['A, B, and C stand in three positions from left to right. A is left of B, and C is not first. Determine the order.', 'A cannot be last because B must follow it.', 'If A were second, B would be third and C first, violating the second condition.', 'Thus A is first; the valid orders are A-B-C and A-C-B. B is not necessarily second.'],
    quiz: [
      q('All backend developers in a team know SQL. Riya knows SQL. What necessarily follows?', 'Riya may or may not be a backend developer', 'Riya is a backend developer', 'Riya is not a backend developer', 'Knowing SQL satisfies a necessary property of backend developers but does not prove membership.', 'Do not reverse an implication.', 'This incorrectly assumes the converse.', 'The facts also do not exclude backend membership.'),
      q('How can you disprove that B must be second in a lineup?', 'Find one valid lineup with B elsewhere', 'Find one valid lineup with B second', 'Find an invalid lineup with B elsewhere', 'A necessary claim must hold in every valid case; one valid counterexample is enough.', 'The counterexample must satisfy every given condition.', 'A supporting example does not rule out alternatives.', 'An invalid lineup says nothing about allowed arrangements.'),
      q('A, B, C, D occupy positions 1–4 from left to right. A is immediately before B, C is first, and D is not last. Who is last?', 'B', 'A', 'D', 'C occupies 1. Pair A-B cannot occupy 2-3 because D would be last; therefore D=2, A=3, B=4.', 'Try the possible adjacent positions for A-B.', 'A must have B immediately after it, so A cannot be last.', 'The statement explicitly excludes D from last position.'),
    ],
  },
  {
    title: 'Multi-step quantitative reasoning', skillId: 'quantitative_aptitude',
    concepts: ['For combined problems, maintain a clear intermediate quantity and its units after each step.', 'Successive changes use the current base, while a stated profit percentage still uses original cost.', 'Work backwards with inverse multipliers when a final amount is given.'],
    example: ['A product is marked 25% above cost and discounted 12%. Find its profit percentage.', 'Let cost be 100, making marked price 125.', 'Selling price=125×0.88=110.', 'Profit=10 on cost 100, so profit percentage is 10%.'],
    quiz: [
      q('A price increases 20% then decreases 20%. Which multiplier represents the final price?', '1.2 × 0.8', '1 + 0.2 - 0.2', '0.2 × 0.2', 'Each percentage acts on its current base, so the final factor is 0.96.', 'Use remaining/full-price multipliers.', 'Adding opposite percentages assumes the same base.', 'These are change fractions, not whole-price multipliers.'),
      q('A discounted price is 720 after a 10% discount. How is the marked price recovered?', '720 / 0.9', '720 × 1.1', '720 + 10', '720 is 90% of the marked price, so divide by 0.9.', 'Undo multiplication using division.', 'Adding 10% of the reduced price does not undo 10% of the original.', 'A percentage is not a fixed currency amount.'),
      q('An item costs 800, is marked 25% above cost, then discounted 10%. What is the profit percentage?', '12.5%', '15%', '25%', 'Marked=1000; selling=900; profit=100; 100/800×100=12.5%.', 'Compute marked price, then selling price, then profit on cost.', 'Subtracting 10 from 25 mixes percentages with different bases.', '25% is the markup before the discount.'),
    ],
  },
  {
    title: 'Mixed placement assessment', skillId: 'quantitative_aptitude',
    concepts: ['Identify the correct base, sample space, or work rate before calculating.', 'Keep conditional changes explicit: a removed item changes the next probability; extra workers change the work rate.', 'Estimate the expected direction of change and check the final answer against that estimate.'],
    example: ['A and B finish a job in 12 and 18 days. They work together for 3 days, then A leaves. How much longer does B need?', 'Joint rate=1/12+1/18=5/36; in 3 days they finish 5/12.', 'Remaining work=7/12.', 'B needs (7/12)/(1/18)=10.5 more days. Total elapsed time is 13.5 days.'],
    quiz: [
      q('Two equally sized classes average 60 and 80. A third class has twice as many students and averages 90. Which expression gives the combined mean?', '(60+80+2×90)/4', '(60+80+90)/3', '(2×60+2×80+90)/5', 'Use weights 1,1,2 because the third class has twice the size.', 'Choose one small class as one unit of weight.', 'This incorrectly gives all three classes equal weight.', 'This gives the doubled weight to the wrong classes.'),
      q('A box has 5 working and 3 faulty parts. For two draws without replacement, which expression gives exactly one faulty part?', '(3/8)(5/7) + (5/8)(3/7)', '(3/8)(5/8)', '(3/8)(2/7)', 'Count faulty-then-working and working-then-faulty as disjoint orders with seven parts on the second draw.', 'Both orders qualify; update the second denominator.', 'This uses replacement and counts only one order.', 'This computes two faulty parts rather than exactly one.'),
      q('A and B finish a job in 10 and 15 days. Together they work 2 days, then B leaves. How many MORE days does A need?', '20/3 days', '6 days', '26/3 days', 'Joint work in two days=2(1/10+1/15)=1/3. Remaining=2/3. A needs (2/3)/(1/10)=20/3 days.', 'Divide the remaining fraction by A’s daily rate.', 'Six days is the time to finish the whole job together.', '26/3 is total elapsed time, including the initial two days.'),
    ],
  },
];
