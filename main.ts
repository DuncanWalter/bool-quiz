type Consistent = boolean & { __consistent: 'brand' }
type Quiz = Question[]
type Response = boolean

function consistent(value: boolean): Consistent {
    return value as Consistent
}
interface ResultSet {
    allLocallyConsistent: boolean,
    results: Array<readonly [locallyConsistent: Consistent, response: boolean]>
}

interface Question {
    name: string
    locallyConsistent?: (localContext: {
        idx: number,
        allResponses: Response[],
        response: Response,
        quiz: Quiz
    }) => Consistent
    globallyConsistent?: (globalContext: {
        idx: number,
        quiz: Quiz,
        response: Response,
        resultSet: ResultSet,
        resultSets: ResultSet[]
    }) => Consistent
}

function product<T>(arrs: T[][]): T[][] {
    switch (arrs.length) {
        case 0: return [[]]
        case 1: return arrs[0].map(each => [each]);
        default: {
            const [first, ...rest] = arrs
            const intermediate = product(rest)
            return first.flatMap(each => intermediate.map(each2 => [each, ...each2]))
        }
    }
}

function solveQuiz(quiz: Quiz) {
    const resultSets = product(quiz.map(_ => [true, false])).map(
        responses => {
            const results = responses.map((response, idx) => {
                const question = quiz[idx];
                const locallyConsistent = (question.locallyConsistent || (() => consistent(true)))({
                    idx,
                    allResponses: responses,
                    response,
                    quiz
                })
                return [locallyConsistent, response] as const
            })
            const allLocallyConsistent = results.reduce((acc, [consistent]) => acc && consistent, true)
            return {
                allLocallyConsistent,
                results
            }
        }
    )

    return resultSets.filter(({ allLocallyConsistent }) => allLocallyConsistent).filter(resultSet =>
        resultSet.results.reduce((acc, [, response], idx) => {
            const question = quiz[idx];
            return acc && (question.globallyConsistent || (() => consistent(true)))({
                idx,
                quiz,
                resultSets,
                resultSet,
                response
            })
        }, true as boolean)
    ).map(({ results }) => results.map(([, response]) => response))
}

const alwaysConsistent: Question = {
    name: 'alwaysConsistent',

    locallyConsistent() {
        return consistent(true)
    }
}

const responseIsTrue: Question = {
    name: 'responseIsTrue',

    locallyConsistent({ response }) {
        return consistent(response)
    }
}

const responseIsFalse: Question = {
    name: 'responseIsFalse',

    locallyConsistent({ response }) {
        return consistent(!response)
    }
}

const adjacentAreSame: Question = {
    name: 'adjacentAreSame',

    locallyConsistent({ idx, response, allResponses }) {
        return consistent(response === (allResponses[idx - 1] === allResponses[idx + 1]))
    }
}

const adjacentAreTrue: Question = {
    name: 'adjacentAreTrue',

    locallyConsistent({ idx, response, allResponses }) {
        return consistent(response === (allResponses[idx - 1] && allResponses[idx + 1]))
    }
}

const adjacentAreFalse: Question = {
    name: 'adjacentAreFalse',

    locallyConsistent({ idx, response, allResponses }) {
        return consistent(response === (!allResponses[idx - 1] && !allResponses[idx + 1]))
    }
}

const oddNumberAreTrue: Question = {
    name: 'oddNumberAreTrue',

    locallyConsistent({ response, allResponses }) {
        const expected = allResponses.filter(each => each).length % 2 === 1
        return consistent(response === expected)
    }
}

const evenNumberAreTrue: Question = {
    name: 'evenNumberAreTrue',

    locallyConsistent({ response, allResponses }) {
        const expected = allResponses.filter(each => each).length % 2 === 0
        return consistent(response === expected)
    }
}

const oddNumberAreFalse: Question = {
    name: 'oddNumberAreFalse',

    locallyConsistent({ response, allResponses }) {
        const expected = allResponses.filter(each => !each).length % 2 === 1
        return consistent(response === expected)
    }
}

const evenNumberAreFalse: Question = {
    name: 'evenNumberAreFalse',

    locallyConsistent({ response, allResponses }) {
        const expected = allResponses.filter(each => !each).length % 2 === 0
        return consistent(response === expected)
    }
}

const allAreSame: Question = {
    name: 'allAreSame',

    locallyConsistent({ response, allResponses }) {
        const allTrue = allResponses.reduce((acc, res) => acc && res, true)
        const allFalse = allResponses.reduce((acc, res) => acc && !res, true)
        return consistent(response === (allTrue || allFalse))
    }
}

const allAreTrue: Question = {
    name: 'allAreTrue',

    locallyConsistent({ response, allResponses }) {
        const expected = allResponses.reduce((acc, res) => acc && res, true)
        return consistent(response === expected)
    }
}

const allAreFalse: Question = {
    name: 'allAreFalse',

    locallyConsistent({ response, allResponses }) {
        const expected = allResponses.reduce((acc, res) => acc && !res, true)
        return consistent(response === expected)
    }
}

const othersAreSame: Question = {
    name: 'othersAreSame',

    locallyConsistent({ idx, response, allResponses }) {
        const othersTrue = allResponses.filter((_, i) => i !== idx).reduce((acc, res) => acc && res, true)
        const othersFalse = allResponses.filter((_, i) => i !== idx).reduce((acc, res) => acc && !res, true)
        return consistent(response === (othersTrue || othersFalse))
    }
}

const othersAreTrue: Question = {
    name: 'othersAreTrue',

    locallyConsistent({ idx, response, allResponses }) {
        const expected = allResponses.filter((_, i) => i !== idx).reduce((acc, res) => acc && res, true)
        return consistent(response === expected)
    }
}

const othersAreFalse: Question = {
    name: 'othersAreFalse',

    locallyConsistent({ idx, response, allResponses }) {
        const expected = allResponses.filter((_, i) => i !== idx).reduce((acc, res) => acc && !res, true)
        return consistent(response === expected)
    }
}

function numQuestionsIs(n: number): Question {
    return {
        name: `numQuestionsIs${n}`,

        locallyConsistent({ response, allResponses }) {
            return consistent(response === (n === allResponses.length))
        }
    }
}

const solutionSetIsUnique: Question = {
    name: 'solutionSetIsUnique',

    globallyConsistent({ idx, response, resultSets }) {
        const consistentResultSets = resultSets.filter(({ allLocallyConsistent }) => allLocallyConsistent)
        const guessedTrueResultSets = consistentResultSets.filter(({ results }) => results[idx][1])
        const guessedFalseResultSets = consistentResultSets.filter(({ results }) => !results[idx][1])
        return consistent(response ? guessedTrueResultSets.length === 1 : guessedFalseResultSets.length > 1)
    }
}

const solutionSetIsNotUnique: Question = {
    name: 'solutionSetIsNotUnique',

    globallyConsistent({ idx, response, resultSets }) {
        const consistentResultSets = resultSets.filter(({ allLocallyConsistent }) => allLocallyConsistent)
        const guessedTrueResultSets = consistentResultSets.filter(({ results }) => results[idx][1])
        const guessedFalseResultSets = consistentResultSets.filter(({ results }) => !results[idx][1])
        return consistent(response ? guessedTrueResultSets.length > 1 : guessedFalseResultSets.length === 1)
    }
}

// // @ts-expect-error
// console.log(solveQuiz([numQuestionsIs(5), alwaysConsistent, othersAreSame, evenNumberAreTrue, solutionSetIsUnique]))

product([[alwaysConsistent], [adjacentAreSame, adjacentAreTrue, adjacentAreFalse], [evenNumberAreFalse, oddNumberAreFalse, oddNumberAreTrue, evenNumberAreTrue], [allAreSame, allAreTrue, allAreFalse, othersAreSame, othersAreTrue, othersAreFalse], [numQuestionsIs(5), numQuestionsIs(6)], [solutionSetIsUnique]]).forEach(quiz => {
    // @ts-expect-error
    console.log(`${quiz.map(q => q.name).join(', ')}:\n-${solveQuiz(quiz).join('\n-')}`)
}) 