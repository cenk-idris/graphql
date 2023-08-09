class profilePage extends HTMLElement {
    constructor() {
        super();
        this.loadUserData();
    }

    async loadUserData() {
        const jwt = localStorage.getItem("jwt");
        const decodedJwt = this.decodeJwt(jwt);
        let response;
        response = await this.getQuery(decodedJwt.sub, jwt);
        localStorage.setItem("skills", JSON.stringify(response.data.skills));
        this.render(response.data);
    }


    async getQuery(id, jwt) {
        const query = `
    query {
    transaction (
      order_by: {amount: desc_nulls_last}
      limit: 5
      where: {type: {_eq: "xp"}, _or: [{attrs: {_eq: {}}}, {attrs: {_has_key: "group"}}], _and: [{path: {_nlike: "%/piscine-js/%"}}, {path: {_nlike: "%/piscine-go/%"}}]}
    ) {
      amount
      createdAt
      path
    }
        user(where: {id: {_eq: ${id}}}) {
          attrs 
          login
          firstName
          lastName
          auditRatio
          totalUp
          totalDown
        }
        audits: transaction(order_by: {createdAt: asc}, where: {type: {_regex: "up|down"}}) {
          type
          amount
          path
          createdAt
        }
          xp: transaction(order_by: {createdAt: asc}, where: {
          type: {_eq: "xp"}
            eventId: {_eq: 20}
        }) {
                createdAt
            amount
                path
          }
          skills: transaction(order_by: {createdAt: asc}, where: {
              eventId: {_eq: 20}
          }) {
                  type
              amount
                  path
            }
          xpJS: transaction(order_by: {createdAt: asc}, where: {
          type: {_eq: "xp"}
            eventId: {_eq: 37}
        }) {
                createdAt
            amount
                path
          }
          xpGo: transaction(order_by: {createdAt: asc}, where: {
          type: {_eq: "xp"}
            eventId: {_eq: 2}
        }) {
                createdAt
            amount
                path
          }
        xpTotal : transaction_aggregate(
        where: {
          userId: {_eq: ${id}}
          type: {_eq: "xp"}
          eventId: {_eq: 20}
        }
      ) {aggregate {sum {amount}}}
        xpJsTotal : transaction_aggregate(
        where: {
          userId: {_eq: ${id}}
          type: {_eq: "xp"}
          eventId: {_eq: 37}
        }
      ) {aggregate {sum {amount}}}
        xpGoTotal : transaction_aggregate(
        where: {
          userId: {_eq: ${id}}
          type: {_eq: "xp"}
          eventId: {_eq: 2}
        }
      ) {aggregate {sum {amount}}}
      }
      `;
        const response = await fetch(
            "https://01.gritlab.ax/api/graphql-engine/v1/graphql",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${jwt}`,
                },
                body: JSON.stringify({ query }),
            }
        );

        const data = await response.json();
        console.log(data)
        data.data.topProjects = data.data.transaction.map((project) => {
            let path = project.path.split('/')
            return path[path.length - 1]
        })
        return data;

    }
    catch(error) {
        throw new Error("Failed to fetch data from GraphQL API");
    }

    decodeJwt(jwt) {
        const base64Url = jwt.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const decoded = atob(base64);
        const result = JSON.parse(decoded);
        return result;
    }

    totalXPAmount(xps) {
        let xp_total = 0;
        for (let i = 0; i < xps.length; i++) {
            xp_total += xps[i].amount;
        }
        return xp_total;
    }

    randomColor() {
        const letters = "0123456789ABCDEF";
        let color = "#";
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }



    logOut(event) {
        localStorage.removeItem("jwt");
        location.reload();
    }



    connectedCallback() {
        this.addEventListener("click", (event) => {
            if (event.target.id === "logout-btn") {
                this.logOut();
            } else{
                // Handle other element's click event
                return
            }
        });
    }
    disconnectedCallback() {}

    render(data) {
        this.innerHTML =
            `<div class="container">
                <nav>
  <ul>
    <li><strong>User Info</strong></li>
  </ul>
  <ul>
    <li>Name: ${data.user[0].attrs.firstName}</li>
    <li>Surname: ${data.user[0].attrs.lastName}</li>
    <li>Email: ${data.user[0].attrs.email}</li>
    <li>Gender: ${data.user[0].attrs.gender}</li>
    <li>Country: ${data.user[0].attrs.country}</li>
    <button id="logout-btn" class="btn btn-lg w-25 mx-auto btn-primary btn-block">Log Out</button>
  </ul>
</nav>
<br>
    <section class="grid">
        <div class="">
          <div>
              <h1>Top Projects</h1>
              <p>${data.topProjects[0]} | Exp: ${data.transaction[0].amount}</p>
              <p>${data.topProjects[1]} | Exp: ${data.transaction[1].amount}</p>
              <p>${data.topProjects[2]} | Exp: ${data.transaction[2].amount}</p>
              <p>${data.topProjects[3]} | Exp: ${data.transaction[3].amount}</p>
              <p>${data.topProjects[4]} | Exp: ${data.transaction[4].amount}</p>
          </div>
          
      </div>
      <div class="">
          <div>
              <h1>User Stats</h1>
              <p>Total XP: ${Math.round(
                data.xpTotal.aggregate.sum.amount / 1000
            )} kB</p>
              <p>Done: ${Math.round(data.user[0].totalUp / 1000)} kB</p>
              <p>Received: ${Math.round(data.user[0].totalDown / 1000)} kB</p>
              <p>Audit Ratio: ${Number(
                data.user[0].auditRatio.toFixed(1)
            )}</p>
              
          </div>
          
      </div>
</section>
      

      <div class="position-relative overflow-hidden p-3 p-md-5 m-md-3 text-center bg-dark">
          
              
                  <p class="lead text-white">Audits Ratio</p>
          
                  <svg width="400" height="150">
                  <!-- Done bar -->
                  <rect x="0" y="25" width="${Math.round(
                data.user[0].totalUp / 10000
            )}" height="50" fill="#0074D9"/>
                  <text x="0" y="20" fill="#FFFFFF" font-size="14">projects: </text>
                  <text x="70" y="20" fill="#FFFFFF" font-size="14">${Math.round(
                data.user[0].totalUp / 1000
            )} kB</text>

                  <rect x="50" y="75" width="220" height="10" fill="#353A35"/>

                  <!-- Received bar -->
                  <rect x="0" y="105" width="${Math.round(
                data.user[0].totalDown / 10000
            )}" height="50" fill="#FF4136"/>
                  <text x="0" y="100" fill="#FFFFFF" font-size="14">audits: </text>
                  <text x="70" y="100" fill="#FFFFFF" font-size="14">${Math.round(
                data.user[0].totalDown / 1000
            )} kB</text>
                  </svg>
                  <h3 class="display-4 text-white">${Number(
                data.user[0].auditRatio.toFixed(1)
            )}</h3>
  </div>
  <div class="position-relative overflow-hidden p-3 p-md-5 m-md-3 text-center bg-dark">
          
              
                  <p class="lead text-white">Project Exp</p>
          
                  <svg width="400" height="500">
                  <!-- first project bar -->
                  <rect x="0" y="25" width="${Math.round(
                data.transaction[0].amount / 1000
            )}" height="50" fill="#0074D9"/>
                  <text x="0" y="20" fill="#FFFFFF" font-size="14">${data.topProjects[0]} </text>
                  <text x="170" y="20" fill="#FFFFFF" font-size="14">${Math.round(
                data.transaction[0].amount / 1000
            )} kB</text>
                  <!-- second project bar -->
                  <rect x="0" y="105" width="${Math.round(
                data.transaction[1].amount / 1000
            )}" height="50" fill="#0074D9"/>
                  <text x="0" y="100" fill="#FFFFFF" font-size="14">${data.topProjects[1]} </text>
                  <text x="170" y="100" fill="#FFFFFF" font-size="14">${Math.round(
                data.transaction[1].amount / 1000
            )} kB</text>
                  <!-- third project bar -->
                  <rect x="0" y="185" width="${Math.round(
                data.transaction[2].amount / 1000
            )}" height="50" fill="#0074D9"/>
                  <text x="0" y="180" fill="#FFFFFF" font-size="14">${data.topProjects[2]} </text>
                  <text x="170" y="180" fill="#FFFFFF" font-size="14">${Math.round(
                data.transaction[2].amount / 1000
            )} kB</text>
                  <!-- fourth project bar -->
                  <rect x="0" y="270" width="${Math.round(
                data.transaction[3].amount / 1000
            )}" height="50" fill="#0074D9"/>
                  <text x="0" y="260" fill="#FFFFFF" font-size="14">${data.topProjects[3]} </text>
                  <text x="170" y="260" fill="#FFFFFF" font-size="14">${Math.round(
                data.transaction[3].amount / 1000
            )} kB</text>
                  <!-- fifth project bar -->
                  <rect x="0" y="355" width="${Math.round(
                data.transaction[4].amount / 1000
            )}" height="50" fill="#0074D9"/>
                  <text x="0" y="340" fill="#FFFFFF" font-size="14">${data.topProjects[4]} </text>
                  <text x="170" y="340" fill="#FFFFFF" font-size="14">${Math.round(
                data.transaction[4].amount / 1000
            )} kB</text>
  </div>
    <div>
    <div  class="text-center">
                  <div id="main"></div>
                  <div id="pie-chart" style="margin-left: 30px">
                  </div>
                  <img id="jpg-export">
              </div>
</div>
    </div>
    
`;
    }
}

customElements.define("profile-page", profilePage);
