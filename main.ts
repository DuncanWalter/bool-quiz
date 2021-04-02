type Consistant = boolean & { __consistant: 'brand' }
type Quiz = Question[]
type Responses = boolean[]

function consistant(value: boolean): Consistant {
    return value as Consistant
}

interface Question {
    name: string
    locallyConsistant?: (localContext: {
        idx: number,
        allResponses: Responses,
        response: boolean,
        quiz: Quiz
    }) => Consistant
    globallyConsistant?: (globalContext: {
        idx: number
        quiz: Quiz
        responseSet: Array<readonly [locallyConsistant: Consistant, response: boolean]>
        responseSets: Array<readonly [locallyConsistant: Consistant, response: boolean]>[]
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
    const responseSets = product(quiz.map(_ => [true, false])).map(
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
            const allConsistant = results.reduce((acc, [conistant]) => acc && conistant, true)
            return {
                allConsistant,
                rawResults: results
            }
        }
    )

    const allRawResults = responseSets.map(({ rawResults }) => rawResults)

    return responseSets.filter(({ allConsistant }) => allConsistant).filter(({ rawResults }) =>
        quiz.reduce((acc, question, idx) =>
            acc && (question.globallyConsistant || (() => consistant(true)))({
                idx,
                quiz,
                responseSets: allRawResults,
                responseSet: rawResults
            })
            , true as boolean)
    ).map(({ rawResults }) => rawResults.map(([, response]) => response))
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

const oddNumberAreTrue: Question = {
    name: 'adjacentAreSame',

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

const solutionSetIsUnique: Question = { name: 'solutionSetIsUnique' /* TODO later */ }

// // @ts-expect-error
// console.log(solveQuiz([alwaysConsistant, adjacentAreSame, evenNumberAreFalse, solutionSetIsUnique]))

product([[alwaysConsistant], [adjacentAreSame, adjacentAreTrue], [evenNumberAreFalse, oddNumberAreFalse, oddNumberAreTrue, evenNumberAreTrue], [solutionSetIsUnique]]).forEach(quiz => {
    // @ts-expect-error
    console.log(`${quiz.map(q => q.name).join(', ')}:\n-${solveQuiz(quiz).join('\n-')}`)
})