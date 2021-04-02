type Consistant = boolean & { __consistant: 'brand' }
type Quiz = Question[]
type Response = boolean

function consistant(value: boolean): Consistant {
    return value as Consistant
}
interface ResultSet {
    allLocallyConsistant: boolean,
    results: Array<readonly [locallyConsistant: Consistant, response: boolean]>
}

interface Question {
    name: string
    locallyConsistant?: (localContext: {
        idx: number,
        allResponses: Response[],
        response: Response,
        quiz: Quiz
    }) => Consistant
    globallyConsistant?: (globalContext: {
        idx: number,
        quiz: Quiz,
        response: Response,
        resultSet: ResultSet,
        resultSets: ResultSet[]
    }) => Consistant
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
                const locallyConsistant = (question.locallyConsistant || (() => consistant(true)))({
                    idx,
                    allResponses: responses,
                    response,
                    quiz
                })
                return [locallyConsistant, response] as const
            })
            const allLocallyConsistant = results.reduce((acc, [consistant]) => acc && consistant, true)
            return {
                allLocallyConsistant,
                results
            }
        }
    )

    return resultSets.filter(({ allLocallyConsistant }) => allLocallyConsistant).filter(resultSet =>
        resultSet.results.reduce((acc, [, response], idx) => {
            const question = quiz[idx];
            return acc && (question.globallyConsistant || (() => consistant(true)))({
                idx,
                quiz,
                resultSets,
                resultSet,
                response
            })
        }, true as boolean)
    ).map(({ results }) => results.map(([, response]) => response))
}

const alwaysConsistant: Question = {
    name: 'alwaysConsistant',

    locallyConsistant() {
        return consistant(true)
    }
}

const responseIsTrue: Question = {
    name: 'responseIsTrue',

    locallyConsistant({ response }) {
        return consistant(response)
    }
}

const responseIsFalse: Question = {
    name: 'responseIsFalse',

    locallyConsistant({ response }) {
        return consistant(!response)
    }
}

const adjacentAreSame: Question = {
    name: 'adjacentAreSame',

    locallyConsistant({ idx, response, allResponses }) {
        return consistant(response === (allResponses[idx - 1] === allResponses[idx + 1]))
    }
}

const adjacentAreTrue: Question = {
    name: 'adjacentAreTrue',

    locallyConsistant({ idx, response, allResponses }) {
        return consistant(response === (allResponses[idx - 1] && allResponses[idx + 1]))
    }
}

const adjacentAreFalse: Question = {
    name: 'adjacentAreFalse',

    locallyConsistant({ idx, response, allResponses }) {
        return consistant(response === (!allResponses[idx - 1] && !allResponses[idx + 1]))
    }
}

const oddNumberAreTrue: Question = {
    name: 'oddNumberAreTrue',

    locallyConsistant({ response, allResponses }) {
        const expected = allResponses.filter(each => each).length % 2 === 1
        return consistant(response === expected)
    }
}

const evenNumberAreTrue: Question = {
    name: 'evenNumberAreTrue',

    locallyConsistant({ response, allResponses }) {
        const expected = allResponses.filter(each => each).length % 2 === 0
        return consistant(response === expected)
    }
}

const oddNumberAreFalse: Question = {
    name: 'oddNumberAreFalse',

    locallyConsistant({ response, allResponses }) {
        const expected = allResponses.filter(each => !each).length % 2 === 1
        return consistant(response === expected)
    }
}

const evenNumberAreFalse: Question = {
    name: 'evenNumberAreFalse',

    locallyConsistant({ response, allResponses }) {
        const expected = allResponses.filter(each => !each).length % 2 === 0
        return consistant(response === expected)
    }
}

const allAreSame: Question = {
    name: 'allAreSame',

    locallyConsistant({ response, allResponses }) {
        const allTrue = allResponses.reduce((acc, res) => acc && res, true)
        const allFalse = allResponses.reduce((acc, res) => acc && !res, true)
        return consistant(response === (allTrue || allFalse))
    }
}

const allAreTrue: Question = {
    name: 'allAreTrue',

    locallyConsistant({ response, allResponses }) {
        const expected = allResponses.reduce((acc, res) => acc && res, true)
        return consistant(response === expected)
    }
}

const allAreFalse: Question = {
    name: 'allAreFalse',

    locallyConsistant({ response, allResponses }) {
        const expected = allResponses.reduce((acc, res) => acc && !res, true)
        return consistant(response === expected)
    }
}

const othersAreSame: Question = {
    name: 'othersAreSame',

    locallyConsistant({ idx, response, allResponses }) {
        const othersTrue = allResponses.filter((_, i) => i !== idx).reduce((acc, res) => acc && res, true)
        const othersFalse = allResponses.filter((_, i) => i !== idx).reduce((acc, res) => acc && !res, true)
        return consistant(response === (othersTrue || othersFalse))
    }
}

const othersAreTrue: Question = {
    name: 'othersAreTrue',

    locallyConsistant({ idx, response, allResponses }) {
        const expected = allResponses.filter((_, i) => i !== idx).reduce((acc, res) => acc && res, true)
        return consistant(response === expected)
    }
}

const othersAreFalse: Question = {
    name: 'othersAreFalse',

    locallyConsistant({ idx, response, allResponses }) {
        const expected = allResponses.filter((_, i) => i !== idx).reduce((acc, res) => acc && !res, true)
        return consistant(response === expected)
    }
}

function numQuestionsIs(n: number): Question {
    return {
        name: `numQuestionsIs${n}`,

        locallyConsistant({ response, allResponses }) {
            return consistant(response === (n === allResponses.length))
        }
    }
}

const solutionSetIsUnique: Question = {
    name: 'solutionSetIsUnique',

    globallyConsistant({ idx, response, resultSets }) {
        const consistantResultSets = resultSets.filter(({ allLocallyConsistant }) => allLocallyConsistant)
        const guessedTrueResultSets = consistantResultSets.filter(({ results }) => results[idx][1])
        const guessedFalseResultSets = consistantResultSets.filter(({ results }) => !results[idx][1])
        return consistant(response ? guessedTrueResultSets.length === 1 : guessedFalseResultSets.length > 1)
    }
}

const solutionSetIsNotUnique: Question = {
    name: 'solutionSetIsNotUnique',

    globallyConsistant({ idx, response, resultSets }) {
        const consistantResultSets = resultSets.filter(({ allLocallyConsistant }) => allLocallyConsistant)
        const guessedTrueResultSets = consistantResultSets.filter(({ results }) => results[idx][1])
        const guessedFalseResultSets = consistantResultSets.filter(({ results }) => !results[idx][1])
        return consistant(response ? guessedTrueResultSets.length > 1 : guessedFalseResultSets.length === 1)
    }
}

// // @ts-expect-error
// console.log(solveQuiz([numQuestionsIs(5), alwaysConsistant, othersAreSame, evenNumberAreTrue, solutionSetIsUnique]))

product([[alwaysConsistant], [adjacentAreSame, adjacentAreTrue, adjacentAreFalse], [evenNumberAreFalse, oddNumberAreFalse, oddNumberAreTrue, evenNumberAreTrue], [allAreSame, allAreTrue, allAreFalse, othersAreSame, othersAreTrue, othersAreFalse], [numQuestionsIs(5), numQuestionsIs(6)], [solutionSetIsUnique]]).forEach(quiz => {
    // @ts-expect-error
    console.log(`${quiz.map(q => q.name).join(', ')}:\n-${solveQuiz(quiz).join('\n-')}`)
}) 